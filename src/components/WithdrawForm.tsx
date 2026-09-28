import React, { useEffect, useMemo, useState } from 'react';
import { isAddress, parseUnits, formatUnits } from 'viem';
import { AppKit } from '@circle-fin/app-kit';
import { useWallet } from '../context/WalletContext';
import type { NewPayout } from '../hooks/usePayouts';
import { readableError, USDC_DECIMALS, formatUsdc } from '../lib/arc';
import styles from './WithdrawForm.module.scss';

// Тестнет-сети, куда App Kit умеет бриджить USDC с Arc (CCTP)
const DEST_CHAINS = [
  { id: 'Ethereum_Sepolia', name: 'Ethereum Sepolia' },
  { id: 'Base_Sepolia', name: 'Base Sepolia' },
  { id: 'Arbitrum_Sepolia', name: 'Arbitrum Sepolia' },
  { id: 'Optimism_Sepolia', name: 'Optimism Sepolia' },
];

const FEE_RECIPIENT = (import.meta.env.VITE_FEE_RECIPIENT as string | undefined) || '';
const FEE_BPS = Math.min(Math.max(parseInt((import.meta.env.VITE_FEE_BPS as string) || '0', 10) || 0, 0), 500); // максимум 5%
const feeEnabled = FEE_BPS > 0 && isAddress(FEE_RECIPIENT);

const kit = new AppKit();

interface Props {
  onRecorded: (p: NewPayout) => Promise<unknown>;
}

/**
 * Вывод делает сам фрилансер со своего кошелька: USDC сжигается на Arc и минтится в выбранной сети.
 * Сервер не держит ключей и не распоряжается чужими деньгами.
 */
export default function WithdrawForm({ onRecorded }: Props) {
  const { address, adapter, usdcBalance, isArc, switchToArc, refreshBalance } = useWallet();

  const [chain, setChain] = useState(DEST_CHAINS[0].id);
  const [dest, setDest] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (address && !dest) setDest(address);
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsed = useMemo(() => {
    if (!/^\d+(\.\d{1,6})?$/.test(amount)) return null;
    try {
      const v = parseUnits(amount, USDC_DECIMALS);
      return v > 0n ? v : null;
    } catch {
      return null;
    }
  }, [amount]);

  const fee = parsed && feeEnabled ? (parsed * BigInt(FEE_BPS)) / 10_000n : 0n;
  const receive = parsed ? parsed - fee : 0n;
  const enough = parsed !== null && usdcBalance !== null && parsed <= usdcBalance;
  const isValid = !!address && !!adapter && isAddress(dest) && parsed !== null && enough;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !parsed) return;
    setSubmitting(true);
    setMessage(null);
    try {
      if (!isArc) await switchToArc();
      const result: any = await kit.bridge({
        from: { adapter, chain: 'Arc_Testnet' },
        to: { adapter, chain: chain as any, recipientAddress: dest },
        amount: formatUnits(parsed, USDC_DECIMALS),
        ...(feeEnabled ? { config: { customFee: { value: formatUnits(fee, USDC_DECIMALS), recipientAddress: FEE_RECIPIENT } } } : {}),
      });

      const burn = result?.steps?.find((s: any) => s.name === 'burn')?.txHash;
      const mint = result?.steps?.find((s: any) => s.name === 'mint')?.txHash;
      if (burn) {
        await onRecorded({
          amount: formatUnits(parsed, USDC_DECIMALS),
          fee: formatUnits(fee, USDC_DECIMALS),
          destChain: chain,
          destAddress: dest,
          sourceTxHash: burn,
          destTxHash: mint ?? null,
          ...(result.state === 'error' ? { status: 'failed' as const } : {}),
        }).catch(() => undefined); // история не должна ломать сам вывод
      }
      if (result?.state === 'error') throw new Error('Bridge failed, funds are safe: you can retry from the same wallet');
      setMessage({ kind: 'ok', text: 'Withdrawal submitted' });
      setAmount('');
    } catch (err) {
      setMessage({ kind: 'err', text: err instanceof Error && !(err as any).shortMessage ? err.message : readableError(err) });
    } finally {
      setSubmitting(false);
      refreshBalance();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label>Target Chain</label>
        <select value={chain} onChange={(e) => setChain(e.target.value)}>
          {DEST_CHAINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label>Destination Address</label>
        <input type="text" value={dest} onChange={(e) => setDest(e.target.value.trim())} placeholder="0x..." className={styles.input} />
        {dest && !isAddress(dest) && <small style={{ color: 'var(--status-danger)' }}>Invalid EVM address</small>}
      </div>

      <div className={styles.field}>
        <label>
          Amount (USDC){usdcBalance !== null && <> · available {formatUsdc(usdcBalance)}</>}
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(',', '.'))}
          placeholder="0.00"
          className={styles.input}
        />
        {parsed !== null && !enough && <small style={{ color: 'var(--status-danger)' }}>Not enough USDC on Arc</small>}
      </div>

      <div className={styles.preview}>
        <div className={styles.previewRow}>
          <span>Service Fee{feeEnabled ? ` (${FEE_BPS / 100}%)` : ''}</span>
          <span>{formatUnits(fee, USDC_DECIMALS)} USDC</span>
        </div>
        <div className={styles.previewRow}>
          <span>You Receive (before bridge gas)</span>
          <span>{formatUnits(receive, USDC_DECIMALS)} USDC</span>
        </div>
      </div>

      {message && <div style={{ color: message.kind === 'ok' ? 'var(--status-success)' : 'var(--status-danger)', fontSize: '0.85rem' }}>{message.text}</div>}

      <button type="submit" disabled={!isValid || submitting} className={styles.submit}>
        {submitting ? 'Confirm in wallet...' : 'Withdraw'}
      </button>
    </form>
  );
}
