import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { readableError, shortAddr } from '../lib/arc';
import styles from './WalletConnector.module.scss';

export default function WalletConnector() {
  const { wallets, address, isArc, connect, disconnect, switchToArc } = useWallet();
  const [error, setError] = useState<string | null>(null);

  if (address) {
    return (
      <div className={styles.connector}>
        {isArc ? (
          <span className={styles.status}>
            <span className={styles.dot} />
            Arc Testnet
          </span>
        ) : (
          <button className={styles.walletBtn} onClick={() => switchToArc().catch((e) => setError(readableError(e)))}>
            Switch to Arc
          </button>
        )}
        <span className={styles.address}>{shortAddr(address)}</span>
        <button onClick={disconnect} className={styles.disconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={styles.connector}>
      {wallets.length === 0 ? (
        <span className={styles.noWallet}>No wallet detected</span>
      ) : (
        <div className={styles.walletList}>
          {wallets.map((w) => (
            <button
              key={w.info.uuid}
              onClick={() => connect(w).catch((e) => setError(readableError(e)))}
              className={styles.walletBtn}
            >
              {/* иконка приходит от расширения: рендерим только data:image, без внешних URL */}
              {w.info.icon?.startsWith('data:image/') && <img src={w.info.icon} alt="" width={20} height={20} />}
              {w.info.name}
            </button>
          ))}
        </div>
      )}
      {error && <span className={styles.noWallet} style={{ color: 'var(--status-danger)' }}>{error}</span>}
    </div>
  );
}
