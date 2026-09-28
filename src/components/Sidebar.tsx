import React from 'react';
import { LayoutDashboard, FileText, ArrowUpRight, Repeat } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { formatUsdc, shortAddr } from '../lib/arc';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchRole: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onSwitchRole }: SidebarProps) {
  const { address, role, usdcBalance, isArc } = useWallet();

  const menuItems =
    role === 'freelancer'
      ? [
          { id: 'deals', name: 'My Jobs', icon: FileText },
          { id: 'withdraw', name: 'Withdraw', icon: ArrowUpRight },
        ]
      : [
          { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
          { id: 'deals', name: 'My Escrows', icon: FileText },
        ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebar__header}>
        <div className={styles.sidebar__logo}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
            const Icon = item.icon;
            return (
              <li key={item.id} className={styles.sidebar__item}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`${styles.sidebar__link} ${activeTab === item.id ? styles['sidebar__link--active'] : ''}`}
                >
                  <Icon />
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
          {role && (
            <li className={styles.sidebar__item}>
              <button onClick={onSwitchRole} className={styles.sidebar__link}>
                <Repeat />
                <span>Switch role ({role === 'client' ? 'Client' : 'Freelancer'})</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      <div className={styles.sidebar__footer}>
        <div className={styles.sidebar__network}>
          <span className={styles['sidebar__network-dot']} style={{ background: isArc ? undefined : 'var(--status-danger)' }} />
          <span>{isArc ? 'Arc Testnet' : 'Wrong network'}</span>
        </div>
        {address && (
          <div className={styles.sidebar__wallet}>
            <div className={styles['sidebar__wallet-avatar']}>{role === 'freelancer' ? 'FL' : 'CL'}</div>
            <div className={styles['sidebar__wallet-info']}>
              <span className={styles['sidebar__wallet-address']}>{shortAddr(address)}</span>
              <span className={styles['sidebar__wallet-balance']}>
                {usdcBalance === null ? '...' : formatUsdc(usdcBalance)} USDC
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
