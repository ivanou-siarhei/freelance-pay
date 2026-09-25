import React from 'react';
import { LayoutDashboard, Shuffle, FileText, ArrowUpRight } from 'lucide-react';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  walletBalance: number;
}

export default function Sidebar({ activeTab, setActiveTab, walletBalance }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'stream-manager', name: 'Stream Manager', icon: Shuffle },
    { id: 'invoice-vault', name: 'Escrow & Invoices', icon: FileText },
    { id: 'withdraw', name: 'Withdraw', icon: ArrowUpRight },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebar__header}>
        <div className={styles.sidebar__logo}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className={styles.sidebar__brand}>
          Flow<span>Pay</span>
        </div>
      </div>

      <nav className={styles.sidebar__nav}>
        <ul className={styles.sidebar__list}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id} className={styles.sidebar__item}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`${styles.sidebar__link} ${
                    isActive ? styles['sidebar__link--active'] : ''
                  }`}
                >
                  <IconComponent />
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.sidebar__footer}>
        <div className={styles.sidebar__network}>
          <span className={styles['sidebar__network-dot']} />
          <span>Arc Network</span>
        </div>
        <div className={styles.sidebar__wallet}>
          <div className={styles['sidebar__wallet-avatar']}>FP</div>
          <div className={styles['sidebar__wallet-info']}>
            <span className={styles['sidebar__wallet-address']}>arc1...4x9f</span>
            <span className={styles['sidebar__wallet-balance']}>
              {walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
