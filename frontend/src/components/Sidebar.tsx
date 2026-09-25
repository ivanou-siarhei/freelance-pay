'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Shuffle, FileText } from 'lucide-react';
import styles from './Sidebar.module.scss';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Stream Manager', path: '/stream-manager', icon: Shuffle },
    { name: 'Invoice Vault', path: '/invoice-vault', icon: FileText },
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
            strokeWidth="2.5"
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
            const isActive = pathname === item.path || (item.path === '/dashboard' && (pathname === '/' || pathname === '/dashboard'));
            return (
              <li key={item.path} className={styles.sidebar__item}>
                <Link
                  href={item.path}
                  className={`${styles.sidebar__link} ${
                    isActive ? styles['sidebar__link--active'] : ''
                  }`}
                >
                  <IconComponent />
                  <span>{item.name}</span>
                </Link>
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
            <span className={styles['sidebar__wallet-balance']}>14,250.00 USDC</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
