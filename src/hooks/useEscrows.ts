import { useCallback, useEffect, useState } from 'react';
import { parseUnits } from 'viem';
import { useWallet } from '../context/WalletContext';
import { erc20Abi, ESCROW_ADDRESS, escrowAbi, EscrowDeal, readableError, USDC_ADDRESS, USDC_DECIMALS } from '../lib/arc';

type WriteFn =
  | 'releaseFunds'
  | 'refundAfterDeadline'
  | 'submitWork'
  | 'claimAfterReview'
  | 'refundByFreelancer'
  | 'initiateDispute'
  | 'resolveDisputeByTimeout';

export function useEscrows() {
  const { address, role, publicClient, walletClient, isArc, switchToArc, refreshBalance } = useWallet();
  const [escrows, setEscrows] = useState<EscrowDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!address || !role || !ESCROW_ADDRESS) return setEscrows([]);
    setLoading(true);
    try {
      const ids = (await publicClient.readContract({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: role === 'client' ? 'getClientEscrowIds' : 'getFreelancerEscrowIds',
        args: [address],
      })) as readonly bigint[];

      const deals = await Promise.all(
        [...ids].reverse().slice(0, 100).map(async (id) => {
          const e: any = await publicClient.readContract({ address: ESCROW_ADDRESS!, abi: escrowAbi, functionName: 'getEscrow', args: [id] });
          return {
            id: e.id,
            client: e.client,
            freelancer: e.freelancer,
            amount: e.amount,
            createdAt: Number(e.createdAt),
            deadline: Number(e.deadline),
            submittedAt: Number(e.submittedAt),
            disputedAt: Number(e.disputedAt),
            status: Number(e.status),
            description: e.description,
          } as EscrowDeal;
        })
      );
      setEscrows(deals);
      setError(null);
    } catch (e) {
      setError(readableError(e));
    } finally {
      setLoading(false);
    }
  }, [address, role, publicClient]);

  useEffect(() => {
    load();
  }, [load]);

  const guard = async () => {
    if (!walletClient || !address) throw new Error('Connect a wallet first');
    if (!ESCROW_ADDRESS) throw new Error('Escrow contract address is not configured');
    if (!isArc) await switchToArc();
  };

  const send = async (label: string, fn: () => Promise<`0x${string}`>) => {
    setPending(label);
    setError(null);
    try {
      await guard();
      const hash = await fn();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw new Error('Transaction reverted');
      await Promise.all([load(), refreshBalance()]);
      return hash;
    } catch (e) {
      setError(e instanceof Error && !(e as any).shortMessage ? e.message : readableError(e));
      throw e;
    } finally {
      setPending(null);
    }
  };

  // Симулируем перед отправкой: контракт отклонит невалидное действие до подписи
  const action = (fn: WriteFn, id: bigint) =>
    send(`${fn}:${id}`, async () => {
      const { request } = await publicClient.simulateContract({
        address: ESCROW_ADDRESS!,
        abi: escrowAbi,
        functionName: fn,
        args: [id],
        account: address!,
      });
      return walletClient!.writeContract(request as any);
    });

  const createEscrow = (freelancer: `0x${string}`, amountStr: string, deadlineSec: number, description: string) =>
    send('create', async () => {
      const amount = parseUnits(amountStr, USDC_DECIMALS);
      const allowance = (await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address!, ESCROW_ADDRESS!],
      })) as bigint;
      if (allowance < amount) {
        // Approve ровно на сумму сделки, а не бесконечный
        const approveHash = await walletClient!.writeContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [ESCROW_ADDRESS!, amount],
          account: address!,
          chain: walletClient!.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }
      const { request } = await publicClient.simulateContract({
        address: ESCROW_ADDRESS!,
        abi: escrowAbi,
        functionName: 'createEscrow',
        args: [freelancer, amount, BigInt(deadlineSec), description],
        account: address!,
      });
      return walletClient!.writeContract(request as any);
    });

  return { escrows, loading, pending, error, setError, reload: load, action, createEscrow };
}
