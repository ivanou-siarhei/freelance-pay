import React, { useEffect } from 'react';
import { usePayouts } from '../hooks/usePayouts';
import styles from './PayoutHistory.module.scss';

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--status-pending)',
  processing: 'var(--accent-primary)',
  done: 'var(--status-success)',
  failed: 'var(--status-danger)',
};

export default function PayoutHistory() {
  const { payouts, loading, fetchPayouts } = usePayouts();

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Chain</th>
            <th>Amount</th>
            <th>Fee</th>
            <th>Status</th>
            <th>TX</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((payout) => (
            <tr key={payout.id}>
              <td>{new Date(payout.created_at).toLocaleDateString()}</td>
              <td>{payout.dest_chain}</td>
              <td className={styles.mono}>{payout.amount} USDC</td>
              <td className={styles.mono}>{payout.fee || 0} USDC</td>
              <td>
                <span
                  className={styles.badge}
                  style={{ color: STATUS_COLORS[payout.status] }}
                >
                  {payout.status}
                </span>
              </td>
              <td>
                {payout.bridge_tx_hash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${payout.bridge_tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {payout.bridge_tx_hash.slice(0, 8)}...
                  </a>
                )}
              </td>
            </tr>
          ))}
          {payouts.length === 0 && (
            <tr>
              <td colSpan={6} className={styles.empty}>No payouts yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
