// src/components/WithdrawForm.tsx
import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { usePayouts } from '../hooks/usePayouts';
import styles from './WithdrawForm.module.scss';

const EVM_CHAINS = [
  { id: 'Ethereum', name: 'Ethereum' },
  { id: 'Base', name: 'Base' },
  { id: 'Polygon', name: 'Polygon' },
  { id: 'Arbitrum', name: 'Arbitrum' },
  { id: 'Optimism', name: 'Optimism' },
];

export default function WithdrawForm() {
  const { wallet } = useWallet();
  const { createPayout } = usePayouts();

  const [chain, setChain] = useState('Ethereum');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected || !address || !amount) return;

    setSubmitting(true);
    try {
      await createPayout(
        'escrow-placeholder', // Will be set from context
        'freelancer-placeholder',
        chain,
        address
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = wallet.connected && address.match(/^0x[a-fA-F0-9]{40}$/) && parseFloat(amount) > 0;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label>Target Chain</label>
        <select value={chain} onChange={(e) => setChain(e.target.value)}>
          {EVM_CHAINS.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label>Destination Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label>Amount (USDC)</label>
        <input
          type="number"
          step="0.000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className={styles.input}
        />
      </div>

      <div className={styles.preview}>
        <div className={styles.previewRow}>
          <span>Network Fee</span>
          <span>~$0.01</span>
        </div>
        <div className={styles.previewRow}>
          <span>Service Fee (1%)</span>
          <span>{amount ? (parseFloat(amount) * 0.01).toFixed(2) : '0.00'} USDC</span>
        </div>
        <div className={styles.previewRow}>
          <span>You Receive</span>
          <span>{amount ? (parseFloat(amount) * 0.99).toFixed(2) : '0.00'} USDC</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid || submitting}
        className={styles.submit}
      >
        {submitting ? 'Processing...' : 'Withdraw'}
      </button>
    </form>
  );
}
