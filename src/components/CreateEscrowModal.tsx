import React, { useState } from 'react';
import { isAddress, parseUnits } from 'viem';
import { useWallet } from '../context/WalletContext';
import { MAX_DESCRIPTION_LENGTH, USDC_DECIMALS, formatUsdc } from '../lib/arc';
import styles from '../App.module.scss';

interface Props {
  onClose: () => void;
  onCreate: (freelancer: `0x${string}`, amount: string, deadlineSec: number, description: string) => Promise<unknown>;
  pending: boolean;
  error: string | null;
}

const inOneWeek = () => {
  const d = new Date(Date.now() + 7 * 86400_000);
  return d.toISOString().slice(0, 10);
};

export default function CreateEscrowModal({ onClose, onCreate, pending, error }: Props) {
  const { address, usdcBalance } = useWallet();
  const [freelancer, setFreelancer] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState(inOneWeek());
  const [desc, setDesc] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!isAddress(freelancer)) return setLocalError('Freelancer must be a valid 0x address');
    if (freelancer.toLowerCase() === address?.toLowerCase()) return setLocalError("You can't hire yourself");
    if (!/^\d+(\.\d{1,6})?$/.test(amount)) return setLocalError('Amount: up to 6 decimals');
    const amt = parseUnits(amount, USDC_DECIMALS);
    if (amt <= 0n) return setLocalError('Amount must be positive');
    if (usdcBalance !== null && amt > usdcBalance) return setLocalError('Not enough USDC');
    // дедлайн = конец выбранного дня по локальному времени
    const deadlineSec = Math.floor(new Date(`${deadline}T23:59:59`).getTime() / 1000);
    if (!Number.isFinite(deadlineSec) || deadlineSec <= Date.now() / 1000) return setLocalError('Deadline must be in the future');
    const d = desc.trim();
    if (!d) return setLocalError('Describe the work');
    if (new TextEncoder().encode(d).length > MAX_DESCRIPTION_LENGTH) return setLocalError(`Description is too long (max ${MAX_DESCRIPTION_LENGTH} bytes)`);

    try {
      await onCreate(freelancer as `0x${string}`, amount, deadlineSec, d);
      onClose();
    } catch {
      /* ошибка показывается из хука */
    }
  };

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        <div className={styles.modalContent__header}>
          <h3>New Escrow Deal</h3>
          <button onClick={onClose} className={styles.modalContent__close} disabled={pending} aria-label="Close">
            &times;
          </button>
        </div>
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.form__group}>
            <label className={styles.form__label}>Freelancer wallet (0x...)</label>
            <input className={styles.form__input} value={freelancer} onChange={(e) => setFreelancer(e.target.value.trim())} placeholder="0x..." required />
          </div>
          <div className={styles.form__row}>
            <div className={styles.form__group}>
              <label className={styles.form__label}>
                Amount (USDC){usdcBalance !== null && ` · balance ${formatUsdc(usdcBalance)}`}
              </label>
              <input className={styles.form__input} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} placeholder="1000" required />
            </div>
            <div className={styles.form__group}>
              <label className={styles.form__label}>Delivery deadline</label>
              <input type="date" className={styles.form__input} value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
            </div>
          </div>
          <div className={styles.form__group}>
            <label className={styles.form__label}>Scope of work (stored on-chain, public)</label>
            <textarea
              rows={3}
              className={styles.form__input}
              style={{ resize: 'vertical', fontFamily: 'var(--font-primary)' }}
              value={desc}
              maxLength={MAX_DESCRIPTION_LENGTH}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Landing page in Figma + React implementation"
              required
            />
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Two wallet prompts: approve exactly this amount of USDC, then lock it in escrow. After the freelancer submits work you have 3 days to release or dispute.
          </p>
          {(localError || error) && <div className={styles.notice} style={{ color: 'var(--status-danger)' }}>{localError || error}</div>}
          <button type="submit" className={styles.form__submit} disabled={pending}>
            {pending ? 'Confirm in wallet...' : 'Lock USDC in Escrow'}
          </button>
        </form>
      </div>
    </div>
  );
}
