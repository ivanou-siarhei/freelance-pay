import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Sun, Moon, ShieldCheck, RefreshCw } from 'lucide-react';
import Sidebar from './components/Sidebar';
import WalletConnector from './components/WalletConnector';
import WithdrawForm from './components/WithdrawForm';
import PayoutHistory from './components/PayoutHistory';
import RoleModal from './components/RoleModal';
import EscrowCard from './components/EscrowCard';
import CreateEscrowModal from './components/CreateEscrowModal';
import { useWallet } from './context/WalletContext';
import { useEscrows } from './hooks/useEscrows';
import { usePayouts } from './hooks/usePayouts';
import { ESCROW_ADDRESS, EscrowStatus, formatUsdc } from './lib/arc';
import styles from './App.module.scss';

const TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  deals: 'Escrow Deals',
  withdraw: 'Withdraw USDC',
};

export default function App() {
  const { address, role, isArc, switchToArc } = useWallet();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState('deals');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { escrows, loading, pending, error, reload, action, createEscrow } = useEscrows();
  const payouts = usePayouts();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Роль определяет доступные вкладки
  useEffect(() => {
    if (role === 'client') setActiveTab('dashboard');
    if (role === 'freelancer') setActiveTab('deals');
    setCreateOpen(false);
  }, [role, address]);

  const stats = useMemo(() => {
    const active = escrows.filter((e) => [EscrowStatus.FundsLocked, EscrowStatus.WorkSubmitted, EscrowStatus.Disputed].includes(e.status));
    return {
      locked: active.reduce((a, e) => a + e.amount, 0n),
      activeCount: active.length,
      review: escrows.filter((e) => e.status === EscrowStatus.WorkSubmitted).length,
      disputed: escrows.filter((e) => e.status === EscrowStatus.Disputed).length,
      paid: escrows.filter((e) => e.status === EscrowStatus.Completed).reduce((a, e) => a + e.amount, 0n),
    };
  }, [escrows]);

  const header = (
    <header className={styles.header}>
      <div className={styles.header__route}>
        <span className={styles['header__route-parent']}>FlowPay /</span>
        <span className={styles['header__route-current']}>{address ? TITLES[activeTab] : 'Connect'}</span>
      </div>
      <div className={styles.header__actions}>
        <WalletConnector />
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={styles.header__toggle}>
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  );

  // ── Кошелёк не подключен: только лендинг ──
  if (!address) {
    return (
      <div id="flowpay_app_root" className={styles.container} style={{ display: 'block' }}>
        <div className={styles.content}>
          {header}
          <main className={styles.main}>
            <div className={styles.titleArea}>
              <div className={styles.titleArea__text}>
                <h1>Freelance escrow on Arc</h1>
                <p>Clients lock USDC, freelancers deliver, the smart contract pays out. Connect a wallet to start.</p>
              </div>
            </div>
            <div className={styles.grid}>
              {[
                ['1. Lock', 'Client locks USDC in the FlowPayEscrow contract with a deadline.'],
                ['2. Deliver', 'Freelancer submits work on-chain before the deadline.'],
                ['3. Get paid', 'Client releases, or payment unlocks automatically after a 3-day review window.'],
              ].map(([t, d]) => (
                <div key={t} className={styles.card}>
                  <div className={styles.card__label}>{t}</div>
                  <div className={styles.card__desc}>{d}</div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  const showRoleModal = !role || roleModalOpen;

  return (
    <div id="flowpay_app_root" className={styles.container}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onSwitchRole={() => setRoleModalOpen(true)} />

      <div className={styles.content}>
        {header}
        <main className={styles.main}>
          {!ESCROW_ADDRESS && (
            <div className={styles.notice} style={{ color: 'var(--status-danger)', marginBottom: 16 }}>
              VITE_ESCROW_ADDRESS is not set. Deploy the contract and add its address to .env.
            </div>
          )}
          {!isArc && (
            <div className={styles.notice} style={{ marginBottom: 16 }}>
              Your wallet is on another network.{' '}
              <button className={styles.btn} onClick={() => switchToArc()} style={{ padding: '4px 10px', fontSize: 12 }}>
                Switch to Arc Testnet
              </button>
            </div>
          )}

          {/* ── CLIENT: dashboard ── */}
          {role === 'client' && activeTab === 'dashboard' && (
            <div>
              <div className={styles.titleArea}>
                <div className={styles.titleArea__text}>
                  <h1>Client Dashboard</h1>
                  <p>Your USDC escrow deals on Arc.</p>
                </div>
                <button onClick={() => setCreateOpen(true)} className={`${styles.btn} ${styles['btn--primary']}`}>
                  <Plus size={16} />
                  <span>New Escrow</span>
                </button>
              </div>
              <div className={styles.grid}>
                <div className={styles.card}>
                  <div className={styles.card__label}>Locked in escrow</div>
                  <div className={styles.card__value}>
                    {formatUsdc(stats.locked)} <span>USDC</span>
                  </div>
                  <div className={styles.card__desc}>{stats.activeCount} active deals</div>
                </div>
                <div className={styles.card}>
                  <div className={styles.card__label}>Awaiting your review</div>
                  <div className={styles.card__value}>{stats.review}</div>
                  <div className={styles.card__desc}>Release or dispute within 3 days</div>
                </div>
                <div className={styles.card}>
                  <div className={styles.card__label}>Paid to freelancers</div>
                  <div className={styles.card__value}>
                    {formatUsdc(stats.paid)} <span>USDC</span>
                  </div>
                  <div className={styles.card__desc}>{stats.disputed} in dispute</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Сделки: заказчик видит исходящие, фрилансер входящие ── */}
          {role && activeTab === 'deals' && (
            <div>
              <div className={styles.titleArea}>
                <div className={styles.titleArea__text}>
                  <h1>{role === 'client' ? 'My Escrows' : 'My Jobs'}</h1>
                  <p>
                    {role === 'client'
                      ? 'Deals where you locked USDC for a freelancer.'
                      : 'Deals where a client locked USDC for you. Submit work before the deadline to get paid.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => reload()} className={styles.btn} disabled={loading}>
                    <RefreshCw size={14} />
                    <span>{loading ? 'Loading...' : 'Refresh'}</span>
                  </button>
                  {role === 'client' && (
                    <button onClick={() => setCreateOpen(true)} className={`${styles.btn} ${styles['btn--primary']}`}>
                      <Plus size={16} />
                      <span>New Escrow</span>
                    </button>
                  )}
                </div>
              </div>

              {error && !createOpen && (
                <div className={styles.notice} style={{ color: 'var(--status-danger)', marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <div className={styles.escrowGrid}>
                {escrows.map((deal) => (
                  <EscrowCard key={deal.id.toString()} deal={deal} role={role} pending={pending} onAction={(a, id) => action(a, id).catch(() => undefined)} />
                ))}
                {!loading && escrows.length === 0 && (
                  <div className={styles.notice} style={{ gridColumn: '1 / -1', justifyContent: 'center', padding: 40 }}>
                    <ShieldCheck size={16} />
                    {role === 'client' ? 'No escrows yet. Create your first deal.' : 'No jobs yet. Share your wallet address with a client.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── FREELANCER: withdraw ── */}
          {role === 'freelancer' && activeTab === 'withdraw' && (
            <div>
              <div className={styles.titleArea}>
                <div className={styles.titleArea__text}>
                  <h1>Withdraw USDC</h1>
                  <p>Bridge your earnings from Arc to another chain via Circle CCTP, signed by your own wallet.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32 }}>
                <WithdrawForm onRecorded={payouts.recordPayout} />
                <PayoutHistory payouts={payouts.payouts} loading={payouts.loading} error={payouts.error} onLoad={payouts.fetchPayouts} />
              </div>
            </div>
          )}
        </main>
      </div>

      {showRoleModal && <RoleModal onClose={() => setRoleModalOpen(false)} />}
      {createOpen && role === 'client' && (
        <CreateEscrowModal onClose={() => setCreateOpen(false)} onCreate={createEscrow} pending={pending === 'create'} error={error} />
      )}
    </div>
  );
}
