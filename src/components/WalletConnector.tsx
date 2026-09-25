import React, { useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import styles from './WalletConnector.module.scss';

export default function WalletConnector() {
  const { wallet, wallets, discover, connect, disconnect } = useWallet();

  useEffect(() => {
    discover();
  }, [discover]);

  if (wallet.connected) {
    return (
      <div className={styles.connector}>
        <span className={styles.status}>
          <span className={styles.dot} />
          {wallet.chain}
        </span>
        <span className={styles.address}>
          {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
        </span>
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
              key={w.info.rdns}
              onClick={() => connect(w.provider)}
              className={styles.walletBtn}
            >
              <img src={w.info.icon} alt={w.info.name} width={20} height={20} />
              {w.info.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
