import React from 'react';
import type { Payout } from '../hooks/usePayouts';
import { txUrl } from '../lib/arc';
import styles from './PayoutHistory.module.scss';

const STATUS_COLORS: Record<string, string> = {
  submitted: 'var(--accent-primary)',
  done: 'var(--status-success)',
  failed: 'var(--status-danger)',
};

interface Props {
  payouts: Payout[];
  loading: boolean;
  error: string | null;
  onLoad: () => void;
}

export default function PayoutHistory({ payouts, loading, error, onLoad }: Props) {
  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button onClick={onLoad} className={styles.link} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          {payouts.length ? 'Refresh' : 'Load history (sign in with wallet)'}
        </button>
      </div>
      {error && <div className={styles.empty} style={{ color: 'var(--status-danger)' }}>{error}</div>}
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
          {payouts.map((p) => (
            <tr key={p.id}>
              <td>{new Date(p.created_at).toLocaleDateString()}</td>
              <td>{p.dest_chain.replace('_', ' ')}</td>
              <td className={styles.mono}>{p.amount} USDC</td>
              <td className={styles.mono}>{p.fee} USDC</td>
              <td>
                <span className={styles.badge} style={{ color: STATUS_COLORS[p.status] }}>
                  {p.status}
                </span>
              </td>
              <td>
                <a href={txUrl(p.source_tx_hash)} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  {p.source_tx_hash.slice(0, 8)}...
                </a>
              </td>
            </tr>
          ))}
          {payouts.length === 0 && !error && (
            <tr>
              <td colSpan={6} className={styles.empty}>No payouts yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
