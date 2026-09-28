import React from 'react';
import { Briefcase, Code2 } from 'lucide-react';
import { useWallet, Role } from '../context/WalletContext';
import { shortAddr } from '../lib/arc';
import styles from '../App.module.scss';

/**
 * Выбор роли после подключения кошелька.
 * Роль управляет только интерфейсом. Права на действия проверяет смарт-контракт
 * по адресу, который подписывает транзакцию, поэтому подмена роли в localStorage ничего не даёт.
 */
export default function RoleModal({ onClose }: { onClose?: () => void }) {
  const { address, setRole, disconnect } = useWallet();

  const pick = (r: Role) => {
    setRole(r);
    onClose?.();
  };

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="role-title">
      <div className={styles.modalContent}>
        <div className={styles.modalContent__header}>
          <h3 id="role-title">How will you use PayFlow?</h3>
        </div>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Wallet {shortAddr(address)} connected. Pick a role, you can switch it later in the sidebar.
        </p>

        <div className={styles.roleGrid}>
          <button className={styles.roleCard} onClick={() => pick('client')}>
            <Briefcase size={28} />
            <strong>I'm a Client</strong>
            <span>Create escrow deals, lock USDC, approve work or open a dispute.</span>
          </button>
          <button className={styles.roleCard} onClick={() => pick('freelancer')}>
            <Code2 size={28} />
            <strong>I'm a Freelancer</strong>
            <span>See incoming deals, submit work, get paid and withdraw to any chain.</span>
          </button>
        </div>

        <button className={styles.btn} onClick={disconnect} style={{ alignSelf: 'center' }}>
          Disconnect wallet
        </button>
      </div>
    </div>
  );
}
