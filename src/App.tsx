import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  Shuffle, 
  FileText, 
  Plus, 
  Play, 
  Pause, 
  Check, 
  ArrowUpRight, 
  CreditCard,
  ExternalLink,
  DollarSign,
  Sun,
  Moon,
  Clock,
  ShieldCheck,
  Building,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import WalletConnector from './components/WalletConnector';
import WithdrawForm from './components/WithdrawForm';
import PayoutHistory from './components/PayoutHistory';
import styles from './App.module.scss';

// Type definitions for B2B payment protocol demo
interface Stream {
  id: string;
  label: string;
  receiver: string;
  ratePerSec: number; // in USDC
  streamedAmount: number;
  totalCap: number;
  status: 'active' | 'paused' | 'completed';
  startDate: string;
}

interface Invoice {
  id: string;
  client: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  description: string;
  txHash?: string;
}

interface EscrowDeal {
  id: string;
  freelancer: string;
  client: string;
  amount: number;
  deadline: string;
  description: string;
  status: 'Funds Locked' | 'Under Review' | 'Disputed' | 'Completed';
  createdAt: string;
}

export default function App() {
  // Theme state: dark is default B2B protocol theme
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [walletBalance, setWalletBalance] = useState<number>(14250.00);
  const [isNewStreamModalOpen, setIsNewStreamModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);

  // Active filter for Invoices
  const [invoiceFilter, setInvoiceFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');

  // B2B Escrow subtab inside the invoice tab, plus styling states
  const [vaultSubTab, setVaultSubTab] = useState<'invoices' | 'escrows'>('escrows');
  const [escrowRoleTab, setEscrowRoleTab] = useState<'incoming' | 'outgoing'>('outgoing');
  const [isNewEscrowModalOpen, setIsNewEscrowModalOpen] = useState(false);

  // New Escrow Form Inputs
  const [escrowFreelancer, setEscrowFreelancer] = useState('');
  const [escrowAmount, setEscrowAmount] = useState('');
  const [escrowDeadline, setEscrowDeadline] = useState('2026-06-30');
  const [escrowDesc, setEscrowDesc] = useState('');

  // Stream Form Inputs
  const [streamLabel, setStreamLabel] = useState('');
  const [streamReceiver, setStreamReceiver] = useState('');
  const [streamRate, setStreamRate] = useState('0.025'); // USDC/sec
  const [streamCap, setStreamCap] = useState('5000');

  // Invoice Form Inputs
  const [invoiceClient, setInvoiceClient] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDesc, setInvoiceDesc] = useState('');
  const [invoiceDue, setInvoiceDue] = useState('2026-06-15');

  // Initial Seed Data for Payment Streams
  const [streams, setStreams] = useState<Stream[]>([
    {
      id: 'str-1',
      label: 'Core Protocol DevOps Contract',
      receiver: 'arc1dx82y4v4p89znsh77xmqpl78p9vpy6s2g94h',
      ratePerSec: 0.045, // 0.045 USDC/sec = $162/hr
      streamedAmount: 2450.85,
      totalCap: 10000,
      status: 'active',
      startDate: '2026-05-01',
    },
    {
      id: 'str-2',
      label: 'Q2 Smart Contract Audit',
      receiver: 'arc1sec88t8v4pbbbbsh55xmqpllp9vpy9e2ff9l',
      ratePerSec: 0.125, // $450/hr
      streamedAmount: 5000.00,
      totalCap: 5000,
      status: 'completed',
      startDate: '2026-04-10',
    },
    {
      id: 'str-3',
      label: 'Decentralized IPFS Storage Node Base',
      receiver: 'arc1ipfs3pv4g89znnn77xmqpqqqp9vpy8u3yy3k',
      ratePerSec: 0.008, // approx $28/hr
      streamedAmount: 642.12,
      totalCap: 1500,
      status: 'paused',
      startDate: '2026-05-15',
    }
  ]);

  // Initial Seed Data for B2B Invoice Vault
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'FP-INV-2041',
      client: 'ArcScan Explorer Services',
      amount: 1250.00,
      dueDate: '2026-05-30',
      status: 'Pending',
      description: 'Monthly query plan allocation and Arc Explorer API key hosting'
    },
    {
      id: 'FP-INV-2040',
      client: 'HedgeShield Security Advisors',
      amount: 4500.00,
      dueDate: '2026-05-20',
      status: 'Overdue',
      description: 'Audit scope pre-assessment for Arc bridge extension contracts'
    },
    {
      id: 'FP-INV-2039',
      client: 'NodeSpace Validator Pool',
      amount: 3200.00,
      dueDate: '2026-05-10',
      status: 'Paid',
      description: 'Validator node commission reward split for Epoch 44-48',
      txHash: '0x9482f54a8a0fedfa5742ae1c4e1f727c9b56f94a8080edfdfa8abef2f'
    },
    {
      id: 'FP-INV-2038',
      client: 'Synthetix Liquidity Group',
      amount: 8900.00,
      dueDate: '2026-04-30',
      status: 'Paid',
      description: 'Treasury token market-making provision first tranche',
      txHash: '0x10be98bc57f2e54a8a0fedfaef2f7482f54a8aec4e1f727c9b56f94'
    }
  ]);

  // Initial Seed Data for B2B Escrows
  const [escrows, setEscrows] = useState<EscrowDeal[]>([
    {
      id: 'ESC-4091',
      freelancer: 'arc1freelancer82v4p89znsh77xmqpl78p9vpy6s2g94h',
      client: 'arc1client3pv4g89znnn77xmqpqqqp9vpy8u3yy3k',
      amount: 4200.00,
      deadline: '2026-06-15',
      description: 'Design UI mockup and SCSS integration for FlowPay App Router platform.',
      status: 'Funds Locked',
      createdAt: '2026-05-24'
    },
    {
      id: 'ESC-4089',
      freelancer: 'arc1freelancer82v4p89znsh77xmqpl78p9vpy6s2g94h',
      client: 'arc1client3pv4g89znnn77xmqpqqqp9vpy8u3yy3k',
      amount: 8500.00,
      deadline: '2026-06-20',
      description: 'Smart contract deployment on Arc mainnet and validation protocol integration tests.',
      status: 'Under Review',
      createdAt: '2026-05-22'
    },
    {
      id: 'ESC-4080',
      freelancer: 'arc1dev99t8v4pbbbbsh55xmqpllp9vpy9e2ff9l',
      client: 'arc1client3pv4g89znnn77xmqpqqqp9vpy8u3yy3k',
      amount: 1500.00,
      deadline: '2026-05-18',
      description: 'Setup basic DevOps and GitHub automated CI/CD flow in Arc sandbox environment.',
      status: 'Completed',
      createdAt: '2026-05-10'
    },
    {
      id: 'ESC-4075',
      freelancer: 'arc1artisan3pv4g89znnn77xmqpqqqp9vpy8u3yy3k',
      client: 'arc1client3pv4g89znnn77xmqpqqqp9vpy8u3yy3k',
      amount: 3100.00,
      deadline: '2026-05-15',
      description: 'Brand identity assets design, including vector files, 3D animated loaders.',
      status: 'Disputed',
      createdAt: '2026-05-05'
    }
  ]);

  // Handle theme state across DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Live countdown and real-time streaming accumulation ticker
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = (time: number) => {
      if (lastUpdateRef.current !== null) {
        const deltaSec = (time - lastUpdateRef.current) / 1000;
        
        setStreams((prevStreams) => {
          let balanceImpact = 0;
          const updated = prevStreams.map((s) => {
            if (s.status === 'active') {
              const increment = s.ratePerSec * deltaSec;
              const nextAmount = s.streamedAmount + increment;
              
              if (nextAmount >= s.totalCap) {
                balanceImpact += s.totalCap - s.streamedAmount;
                return { ...s, streamedAmount: s.totalCap, status: 'completed' as const };
              } else {
                balanceImpact += increment;
                return { ...s, streamedAmount: nextAmount };
              }
            }
            return s;
          });

          if (balanceImpact > 0) {
            setWalletBalance((prev) => Math.max(0, prev - balanceImpact));
          }
          return updated;
        });
      }
      lastUpdateRef.current = time;
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Theme toggle utility
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Create stream logic
  const handleCreateStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamLabel || !streamReceiver) return;

    const rate = parseFloat(streamRate);
    const cap = parseFloat(streamCap);

    if (isNaN(rate) || isNaN(cap) || rate <= 0 || cap <= 0) return;

    const newStream: Stream = {
      id: `str-${Date.now()}`,
      label: streamLabel,
      receiver: streamReceiver,
      ratePerSec: rate,
      streamedAmount: 0.00,
      totalCap: cap,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
    };

    setStreams([newStream, ...streams]);
    setIsNewStreamModalOpen(false);
    
    // Reset Form
    setStreamLabel('');
    setStreamReceiver('');
    setStreamRate('0.025');
    setStreamCap('5000');
  };

  // Create invoice logic
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceClient || !invoiceAmount || !invoiceDesc) return;

    const amt = parseFloat(invoiceAmount);
    if (isNaN(amt) || amt <= 0) return;

    const newInvoice: Invoice = {
      id: `FP-INV-${Math.floor(Math.random() * 1000) + 3000}`,
      client: invoiceClient,
      amount: amt,
      dueDate: invoiceDue,
      status: 'Pending',
      description: invoiceDesc,
    };

    setInvoices([newInvoice, ...invoices]);
    setIsNewInvoiceModalOpen(false);

    // Reset Form
    setInvoiceClient('');
    setInvoiceAmount('');
    setInvoiceDesc('');
    setInvoiceDue('2026-06-15');
  };

  // Pay invoice instantly
  const handlePayInvoice = (invoiceId: string, amount: number) => {
    if (walletBalance < amount) {
      alert("Insufficient USDC balance on your Arc Wallet to pay this invoice!");
      return;
    }

    setWalletBalance((prev) => prev - amount);
    setInvoices((prevInvoices) =>
      prevInvoices.map((inv) =>
        inv.id === invoiceId
          ? { 
              ...inv, 
              status: 'Paid', 
              txHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')
            }
          : inv
      )
    );
  };

  // Stream controls
  const handleToggleStreamStatus = (streamId: string) => {
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id === streamId) {
          if (s.status === 'active') {
            return { ...s, status: 'paused' };
          } else if (s.status === 'paused') {
            return { ...s, status: 'active' };
          }
        }
        return s;
      })
    );
  };

  const handleWithdrawStream = (streamId: string) => {
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id === streamId) {
          return { ...s, streamedAmount: 0 };
        }
        return s;
      })
    );
  };

  // Create Escrow logic
  const handleCreateEscrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escrowFreelancer || !escrowAmount || !escrowDesc) return;

    const amt = parseFloat(escrowAmount);
    if (isNaN(amt) || amt <= 0) return;

    if (walletBalance < amt) {
      alert("Insufficient USDC balance in your Arc Wallet to lock in escrow!");
      return;
    }

    const newEscrow: EscrowDeal = {
      id: `ESC-${Math.floor(Math.random() * 1000) + 5000}`,
      freelancer: escrowFreelancer,
      client: 'arc1client3pv4g89znnn77xmqpqqqp9vpy8u3yy3k',
      amount: amt,
      deadline: escrowDeadline,
      description: escrowDesc,
      status: 'Funds Locked',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setWalletBalance((prev) => prev - amt);
    setEscrows([newEscrow, ...escrows]);
    setIsNewEscrowModalOpen(false);

    // Reset Form
    setEscrowFreelancer('');
    setEscrowAmount('');
    setEscrowDesc('');
    setEscrowDeadline('2026-06-30');
  };

  // Escrow milestone release handler
  const handleReleaseEscrowFunds = (escrowId: string) => {
    setEscrows((prev) =>
      prev.map((escrow) =>
        escrow.id === escrowId ? { ...escrow, status: 'Completed' } : escrow
      )
    );
  };

  // Escrow dispute trigger handler
  const handleDisputeEscrow = (escrowId: string) => {
    setEscrows((prev) =>
      prev.map((escrow) =>
        escrow.id === escrowId ? { ...escrow, status: 'Disputed' } : escrow
      )
    );
  };

  // Freelancer milestone submit work handler
  const handleSubmitEscrowWork = (escrowId: string) => {
    setEscrows((prev) =>
      prev.map((escrow) =>
        escrow.id === escrowId ? { ...escrow, status: 'Under Review' } : escrow
      )
    );
  };

  // Calculations for dashboard counters
  const activeStreamsCount = streams.filter((s) => s.status === 'active').length;
  const totalVolumeStreamed = streams.reduce((acc, s) => acc + s.streamedAmount, 0);
  const pendingInvoicesAmount = invoices
    .filter((inv) => inv.status === 'Pending' || inv.status === 'Overdue')
    .reduce((acc, inv) => acc + inv.amount, 0);

  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceFilter === 'All') return true;
    return inv.status === invoiceFilter;
  });

  return (
    <div id="flowpay_app_root" className={styles.container}>
      {/* Interactive Sidebar with live balance state */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        walletBalance={walletBalance} 
      />

      <div className={styles.content}>
        {/* Custom Header with togglers */}
        <header className={styles.header}>
          <div className={styles.header__route}>
            <span className={styles['header__route-parent']}>FlowPay Engine /</span>
            <span className={styles['header__route-current']}>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'stream-manager' && 'Payments Stream Manager'}
              {activeTab === 'invoice-vault' && 'Secure Invoice Vault'}
              {activeTab === 'withdraw' && 'Withdraw USDC'}
            </span>
          </div>

          <div className={styles.header__actions}>
            {/* Live Arc Network connection element */}
            <WalletConnector />

            {/* Design theme selector */}
            <button onClick={toggleTheme} className={styles.header__toggle}>
              {theme === 'dark' ? (
                <>
                  <Sun size={14} />
                  <span>Light Theme</span>
                </>
              ) : (
                <>
                  <Moon size={14} />
                  <span>Dark Theme</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Main Content Areas */}
        <main className={styles.main}>
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <div className={styles.titleArea}>
                <div className={styles.titleArea__text}>
                  <h1>B2B Performance Terminal</h1>
                  <p>Monitoring programmatic liquidity flow and cryptographically verified invoices on the Arc blockchain.</p>
                </div>
                <div className={styles.titleArea__actions}>
                  <button 
                    onClick={() => setIsNewStreamModalOpen(true)} 
                    className={`${styles.btn} ${styles['btn--primary']}`}
                    id="btn_new_stream"
                  >
                    <Plus size={16} />
                    <span>Open Stream</span>
                  </button>
                  <button 
                    onClick={() => setIsNewInvoiceModalOpen(true)} 
                    className={styles.btn}
                    id="btn_new_invoice"
                  >
                    <FileText size={16} />
                    <span>Issue Invoice</span>
                  </button>
                </div>
              </div>

              {/* Grid of counters */}
              <div className={styles.grid}>
                {/* Metric 1 */}
                <div className={styles.card}>
                  <div className={styles.card__label}>ARC Network Wallet</div>
                  <div className={`${styles.card__value} ${styles['card__value--mono']}`}>
                    {walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span>USDC</span>
                  </div>
                  <div className={styles.card__desc}>
                    <ShieldCheck size={12} className={styles['card__desc-trend']} />
                    <span>Multi-sig secure hot-wallet standard</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className={styles.card}>
                  <div className={styles.card__label}>Total Volume Streamed</div>
                  <div className={`${styles.card__value} ${styles['card__value--mono']}`}>
                    {totalVolumeStreamed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span>USDC</span>
                  </div>
                  <div className={styles.card__desc}>
                    <Sparkles size={12} className={styles['card__desc-trend']} />
                    <span>Ticking at {streams.filter(s => s.status === 'active').reduce((acc, s) => acc + s.ratePerSec, 0).toFixed(3)} USDC/sec</span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className={styles.card}>
                  <div className={styles.card__label}>Pending B2B Invoices</div>
                  <div className={`${styles.card__value} ${styles['card__value--mono']}`}>
                    {pendingInvoicesAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span>USDC</span>
                  </div>
                  <div className={styles.card__desc}>
                    <Clock size={12} style={{ color: 'var(--status-pending)' }} />
                    <span>Requires manual clearance soon</span>
                  </div>
                </div>
              </div>

              {/* Protocol Visual Overview Info Block */}
              <div className="flowpay-glass" style={{ padding: '24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(88, 80, 236, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  flexShrink: 0
                }}>
                  <Shuffle size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Arc Real-Time Protocol Stream active 
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    FlowPay bypasses batch settlement completely. By utilizing the stateful virtual execution of the Arc network, capital flows continuously between business addresses every millisecond. Try initiating an active payment stream to watch the dynamic counter.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setActiveTab('stream-manager')} 
                    className={styles.btn}
                    style={{ fontSize: '12px', padding: '8px 14px' }}
                  >
                    Manage Streams
                  </button>
                </div>
              </div>

              {/* Mini tables: Streams list + unpaid invoices list */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className={styles.tableContainer} style={{ margin: 0 }}>
                  <div className={styles.tableHeader}>
                    <div className={styles.tableHeader__title}>Active Streams Network</div>
                    <button onClick={() => setActiveTab('stream-manager')} className={styles.btn} style={{ padding: '6px 12px', fontSize: '11px' }}>
                      View All
                    </button>
                  </div>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Contract Label</th>
                        <th>Rate Flow</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {streams.slice(0, 3).map((stream) => (
                        <tr key={stream.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{stream.label}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {stream.receiver.slice(0, 10)}...{stream.receiver.slice(-8)}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                              {stream.ratePerSec} USDC/s
                            </div>
                          </td>
                          <td>
                            <span style={{ 
                              color: stream.status === 'active' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600
                            }}>
                              {stream.streamedAmount.toFixed(4)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.tableContainer} style={{ margin: 0 }}>
                  <div className={styles.tableHeader}>
                    <div className={styles.tableHeader__title}>Urgent Invoices</div>
                    <button onClick={() => setActiveTab('invoice-vault')} className={styles.btn} style={{ padding: '6px 12px', fontSize: '11px' }}>
                      Go To Vault
                    </button>
                  </div>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>B2B Client</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.slice(0, 3).map((inv) => (
                        <tr key={inv.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inv.client}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Due: {inv.dueDate}</div>
                          </td>
                          <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            {inv.amount.toLocaleString()} USDC
                          </td>
                          <td>
                            <span className={`${styles.badge} ${
                              inv.status === 'Paid' ? styles['badge--success'] : 
                              inv.status === 'Pending' ? styles['badge--pending'] : styles['badge--danger']
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STREAM MANAGER */}
          {activeTab === 'stream-manager' && (
            <div>
              <div className={styles.titleArea}>
                <div className={styles.titleArea__text}>
                  <h1>Payments Stream Manager</h1>
                  <p>Open, pause or program continuous payment flows direct to provider public keys.</p>
                </div>
                <button                  onClick={() => setIsNewStreamModalOpen(true)} 
                  className={`${styles.btn} ${styles['btn--primary']}`}
                >
                  <Plus size={16} />
                  <span>Open Stream</span>
                </button>
              </div>

              {/* Dynamic streams container */}
              <div className={styles.streamGrid}>
                {streams.map((stream) => {
                  const percent = Math.min(100, (stream.streamedAmount / stream.totalCap) * 100);
                  const isPaused = stream.status === 'paused';
                  const isCompleted = stream.status === 'completed';

                  return (
                    <div 
                      key={stream.id} 
                      className={`${styles.streamCard} ${isPaused ? styles['streamCard--paused'] : ''}`}
                    >
                      <div className={styles.streamCard__header}>
                        <div className={styles.streamCard__meta}>
                          <span className={styles.streamCard__title}>{stream.label}</span>
                          <span className={styles.streamCard__address}>Receiver: {stream.receiver}</span>
                        </div>
                        <span className={`${styles.badge} ${
                          isCompleted ? styles['badge--success'] : 
                          isPaused ? styles['badge--pending'] : styles['badge--success']
                        }`}>
                          {stream.status}
                        </span>
                      </div>

                      <div className={styles.streamCard__live}>
                        <div className={styles.streamCard__count}>
                          {stream.streamedAmount.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                          <span>USDC</span>
                        </div>
                        <div className={styles.streamCard__rate}>
                          <span className={`${styles.header__status_indicator} ${!isPaused && !isCompleted ? 'stream-pulse' : ''}`} style={{
                            backgroundColor: isPaused ? 'var(--status-pending)' : isCompleted ? 'var(--status-success)' : 'var(--accent-primary)',
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%'
                          }} />
                          <span>Streaming {stream.ratePerSec} USDC / second</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className={styles.streamCard__progress}>
                          <div 
                            className={styles.streamCard__progress_bar} 
                            style={{ 
                              width: `${percent}%`,
                              background: isPaused ? 'var(--text-muted)' : 'var(--accent-gradient)'
                            }} 
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <span>Stream progress: {percent.toFixed(1)}%</span>
                          <span>Cap: {stream.totalCap.toLocaleString()} USDC</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className={styles.streamCard__actions}>
                        {!isCompleted && (
                          <button 
                            onClick={() => handleToggleStreamStatus(stream.id)}
                            className={styles.streamCard__btn}
                          >
                            {isPaused ? <Play size={14} /> : <Pause size={14} />}
                            <span>{isPaused ? 'Resume' : 'Pause'}</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleWithdrawStream(stream.id)}
                          className={styles.streamCard__btn}
                          disabled={stream.streamedAmount === 0}
                          style={{ opacity: stream.streamedAmount === 0 ? 0.5 : 1 }}
                        >
                          <RefreshCw size={14} />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: INVOICE & ESCROW VAULT */}
          {activeTab === 'invoice-vault' && (
            <div>
              {/* Core Vault Subtab Switcher */}
              <div className={styles.tabs} style={{ marginBottom: '28px', borderBottom: '2px solid var(--border-color)', display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setVaultSubTab('escrows')}
                  className={`${styles.tabs__btn} ${vaultSubTab === 'escrows' ? styles['tabs__btn--active'] : ''}`}
                  style={{ fontSize: '0.95rem', fontWeight: 600, padding: '12px 24px', transition: 'all 0.2s' }}
                >
                  B2B Secure Escrows
                </button>
                <button
                  onClick={() => setVaultSubTab('invoices')}
                  className={`${styles.tabs__btn} ${vaultSubTab === 'invoices' ? styles['tabs__btn--active'] : ''}`}
                  style={{ fontSize: '0.95rem', fontWeight: 600, padding: '12px 24px', transition: 'all 0.2s' }}
                >
                  Invoices & Corporate Billing
                </button>
              </div>

              {vaultSubTab === 'escrows' ? (
                /* B2B SECURE ESCROW SUBSECTION */
                <div>
                  <div className={styles.titleArea}>
                    <div className={styles.titleArea__text}>
                      <h1>B2B Secure Escrow Vault</h1>
                      <p>Bypass trust barriers by establishing decentralized, cryptographically-locked milestone deposits on Arc.</p>
                    </div>
                    <button 
                      onClick={() => setIsNewEscrowModalOpen(true)}
                      className={`${styles.btn} ${styles['btn--primary']}`}
                    >
                      <Plus size={16} />
                      <span>New Escrow Protocol</span>
                    </button>
                  </div>

                  {/* Escrow Role Tabs */}
                  <div className={styles.tabs} style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setEscrowRoleTab('outgoing')}
                      className={`${styles.tabs__btn} ${escrowRoleTab === 'outgoing' ? styles['tabs__btn--active'] : ''}`}
                      style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ArrowUpRight size={14} />
                      <span>My Outgoing Escrows (Client)</span>
                    </button>
                    <button
                      onClick={() => setEscrowRoleTab('incoming')}
                      className={`${styles.tabs__btn} ${escrowRoleTab === 'incoming' ? styles['tabs__btn--active'] : ''}`}
                      style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ArrowUpRight size={14} style={{ transform: 'rotate(90deg)' }} />
                      <span>My Incoming Escrows (Freelancer)</span>
                    </button>
                  </div>

                  {/* Escrow Deals Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '24px' }}>
                    {escrows
                      .filter(deal => escrowRoleTab === 'incoming' ? deal.freelancer === 'arc1freelancer82v4p89znsh77xmqpl78p9vpy6s2g94h' : deal.client === 'arc1client3pv4g89znnn77xmqpqqqp9vpy8u3yy3k')
                      .map((deal) => (
                        <div key={deal.id} className="flowpay-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-muted)' }}>{deal.id}</span>
                            <span className={`${styles.badge} ${
                              deal.status === 'Completed' ? styles['badge--success'] :
                              deal.status === 'Under Review' ? styles['badge--pending'] :
                              deal.status === 'Disputed' ? styles['badge--danger'] : styles['badge--success']
                            }`} style={{ background: deal.status === 'Funds Locked' ? 'rgba(88,80,236,0.15)' : '', color: deal.status === 'Funds Locked' ? 'var(--accent-primary)' : '' }}>
                              {deal.status === 'Funds Locked' ? 'Funds Locked' : deal.status}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Freelancer:</span>
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{deal.freelancer.slice(0, 14)}...{deal.freelancer.slice(-10)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Client address:</span>
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{deal.client.slice(0, 14)}...{deal.client.slice(-10)}</span>
                            </div>
                          </div>

                          <div style={{ minHeight: '44px' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.4', margin: 0 }}>{deal.description}</p>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Amount Locked</span>
                              <span style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                                {deal.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>USDC</span>
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Deadline limit</span>
                              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <Clock size={12} /> {deal.deadline}
                              </span>
                            </div>
                          </div>

                          {/* Action controls */}
                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                            {deal.status !== 'Completed' ? (
                              <>
                                {escrowRoleTab === 'outgoing' ? (
                                  /* Am Client: can pay or trigger dispute */
                                  <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                    <button
                                      onClick={() => handleReleaseEscrowFunds(deal.id)}
                                      className={`${styles.btn} ${styles['btn--primary']}`}
                                      style={{ flex: 1, padding: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    >
                                      <Check size={14} />
                                      <span>Release Funds</span>
                                    </button>
                                    {deal.status !== 'Disputed' && (
                                      <button
                                        onClick={() => handleDisputeEscrow(deal.id)}
                                        className={styles.btn}
                                        style={{ padding: '10px', fontSize: '12px', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--status-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                      >
                                        <AlertTriangle size={14} />
                                        <span>Dispute Transaction</span>
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  /* Am Freelancer: submit work or review status */
                                  <div style={{ display: 'flex', width: '100%' }}>
                                    {deal.status === 'Funds Locked' && (
                                      <button
                                        onClick={() => handleSubmitEscrowWork(deal.id)}
                                        className={styles.btn}
                                        style={{ flex: 1, padding: '10px', fontSize: '12px', backgroundColor: 'var(--accent-glow)', borderColor: 'rgba(88,80,236,0.3)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                      >
                                        <span>Submit Completed Work</span>
                                      </button>
                                    )}
                                    {deal.status === 'Under Review' && (
                                      <span style={{ width: '100%', textAlign: 'center', display: 'block', padding: '10px', backgroundColor: 'var(--status-pending-muted)', color: 'var(--status-pending)', fontSize: '0.8rem', fontWeight: 600, border: '1px dashed var(--status-pending)', borderRadius: '6px' }}>
                                        Work Submitted. Awaiting client release approval.
                                      </span>
                                    )}
                                    {deal.status === 'Disputed' && (
                                      <span style={{ width: '100%', textAlign: 'center', display: 'block', padding: '10px', backgroundColor: 'var(--status-danger-muted)', color: 'var(--status-danger)', fontSize: '0.8rem', fontWeight: 600, border: '1px dashed var(--status-danger)', borderRadius: '6px' }}>
                                        Disputed. Arc Arbitrator resolution in process.
                                      </span>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', backgroundColor: 'var(--status-success-muted)', color: 'var(--status-success)', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px' }}>
                                <Check size={16} /> Paid & Released on Blockchain
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                    {escrows.filter(deal => escrowRoleTab === 'incoming' ? deal.freelancer === 'arc1freelancer82v4p89znsh77xmqpl78p9vpy6s2g94h' : deal.client === 'arc1client3pv4g89znnn77xmqpqqqp9vpy8u3yy3k').length === 0 && (
                      <div className={styles.emptyState} style={{ gridColumn: '1 / -1', padding: '40px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>No active B2B escrow agreements under specified role standard.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* HIGHLY POLISHED CLASSIC INVOICE LIST */
                <div>
                  <div className={styles.titleArea}>
                    <div className={styles.titleArea__text}>
                      <h1>Secure Invoice Vault</h1>
                      <p>Issue, verify, and resolve smart corporate billing across the Arc blockchain ledger.</p>
                    </div>
                    <button 
                      onClick={() => setIsNewInvoiceModalOpen(true)} 
                      className={`${styles.btn} ${styles['btn--primary']}`}
                    >
                      <Plus size={16} />
                      <span>Issue Invoice</span>
                    </button>
                  </div>

                  {/* Filters */}
                  <div className={styles.tabs}>
                    {(['All', 'Paid', 'Pending', 'Overdue'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setInvoiceFilter(filter)}
                        className={`${styles.tabs__btn} ${invoiceFilter === filter ? styles['tabs__btn--active'] : ''}`}
                      >
                        {filter} ({filter === 'All' ? invoices.length : invoices.filter(i => i.status === filter).length})
                      </button>
                    ))}
                  </div>

                  {/* List */}
                  <div className={styles.tableContainer} style={{ marginTop: 0 }}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Invoice ID</th>
                          <th>B2B Client</th>
                          <th>Description</th>
                          <th>Due Date</th>
                          <th>Amount</th>
                          <th>Ledger Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{inv.id}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{inv.client}</div>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', maxWidth: '280px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                              {inv.description}
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{inv.dueDate}</td>
                            <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC</td>
                            <td>
                              <span className={`${styles.badge} ${
                                inv.status === 'Paid' ? styles['badge--success'] : 
                                inv.status === 'Pending' ? styles['badge--pending'] : styles['badge--danger']
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td>
                              {inv.status !== 'Paid' ? (
                                <button
                                  onClick={() => handlePayInvoice(inv.id, inv.amount)}
                                  className={`${styles.btn} ${styles['btn--primary']}`}
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
                                >
                                  <CreditCard size={12} />
                                  <span>Clear Bills</span>
                                </button>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Check size={12} /> Paid
                                  </span>
                                  {inv.txHash && (
                                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                      tx: {inv.txHash.slice(0, 6)}...{inv.txHash.slice(-6)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredInvoices.length === 0 && (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                              No invoices found for filter: {invoiceFilter}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WITHDRAW */}
          {activeTab === 'withdraw' && (
            <div>
              <div className={styles.titleArea}>
                <div className={styles.titleArea__text}>
                  <h1>Withdraw USDC</h1>
                  <p>Transfer your USDC from Arc to any EVM chain</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <WithdrawForm />
                <PayoutHistory />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: NEW STREAM */}
      {isNewStreamModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalContent__header}>
              <h3>Open Real-Time Payments Stream</h3>
              <button onClick={() => setIsNewStreamModalOpen(false)} className={styles.modalContent__close}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateStream} className={styles.form}>
              <div className={styles.form__group}>
                <label className={styles.form__label}>Stream Agreement Label</label>
                <input 
                  type="text" 
                  value={streamLabel}
                  onChange={(e) => setStreamLabel(e.target.value)}
                  placeholder="e.g. Lead Designer Monthly retainer" 
                  className={styles.form__input} 
                  required
                />
              </div>

              <div className={styles.form__group}>
                <label className={styles.form__label}>Receiver Arc Public Key</label>
                <input 
                  type="text" 
                  value={streamReceiver}
                  onChange={(e) => setStreamReceiver(e.target.value)}
                  placeholder="arc1..." 
                  className={styles.form__input} 
                  required
                />
              </div>

              <div className={styles.form__row}>
                <div className={styles.form__group}>
                  <label className={styles.form__label}>Flow Rate (USDC / second)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={streamRate}
                    onChange={(e) => setStreamRate(e.target.value)}
                    placeholder="0.025" 
                    className={styles.form__input} 
                    required
                  />
                </div>
                <div className={styles.form__group}>
                  <label className={styles.form__label}>Total Cap Limit (USDC)</label>
                  <input 
                    type="number" 
                    value={streamCap}
                    onChange={(e) => setStreamCap(e.target.value)}
                    placeholder="5000" 
                    className={styles.form__input} 
                    required
                  />
                </div>
              </div>

              <button type="submit" className={styles.form__submit}>
                Initialize Flow Stream on Arc Leger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NEW INVOICE */}
      {isNewInvoiceModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalContent__header}>
              <h3>Issue B2B Corporate Invoice</h3>
              <button onClick={() => setIsNewInvoiceModalOpen(false)} className={styles.modalContent__close}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateInvoice} className={styles.form}>
              <div className={styles.form__group}>
                <label className={styles.form__label}>B2B Client Name</label>
                <input 
                  type="text" 
                  value={invoiceClient}
                  onChange={(e) => setInvoiceClient(e.target.value)}
                  placeholder="e.g. Delphi Ventures LLC" 
                  className={styles.form__input} 
                  required
                />
              </div>

              <div className={styles.form__row}>
                <div className={styles.form__group}>
                  <label className={styles.form__label}>Invoice Amount (USDC)</label>
                  <input 
                    type="number" 
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    placeholder="3500" 
                    className={styles.form__input} 
                    required
                  />
                </div>
                <div className={styles.form__group}>
                  <label className={styles.form__label}>Due Date</label>
                  <input 
                    type="date" 
                    value={invoiceDue}
                    onChange={(e) => setInvoiceDue(e.target.value)}
                    className={styles.form__input} 
                    required
                  />
                </div>
              </div>

              <div className={styles.form__group}>
                <label className={styles.form__label}>Statement / Description of Work</label>
                <textarea 
                  rows={3}
                  value={invoiceDesc}
                  onChange={(e) => setInvoiceDesc(e.target.value)}
                  placeholder="Provide detailed breakdown of consulting services or infrastructure supply..." 
                  className={styles.form__input}
                  style={{ resize: 'vertical', fontFamily: 'var(--font-primary)' }}
                  required
                />
              </div>

              <button type="submit" className={styles.form__submit}>
                Issue Cryptographic Corporate Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW ESCROW AGREEMENT */}
      {isNewEscrowModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalContent__header}>
              <h3>Establish Secure Cryptographic Escrow</h3>
              <button onClick={() => setIsNewEscrowModalOpen(false)} className={styles.modalContent__close}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateEscrow} className={styles.form}>
              <div className={styles.form__group}>
                <label className={styles.form__label}>Freelancer Public Arc Key</label>
                <input 
                  type="text" 
                  value={escrowFreelancer}
                  onChange={(e) => setEscrowFreelancer(e.target.value)}
                  placeholder="arc1freelancer..." 
                  className={styles.form__input} 
                  required
                />
              </div>

              <div className={styles.form__row}>
                <div className={styles.form__group}>
                  <label className={styles.form__label}>Locked Deposit (USDC)</label>
                  <input 
                    type="number" 
                    value={escrowAmount}
                    onChange={(e) => setEscrowAmount(e.target.value)}
                    placeholder="e.g. 5000" 
                    className={styles.form__input} 
                    required
                  />
                </div>
                <div className={styles.form__group}>
                  <label className={styles.form__label}>Agreement Deadline</label>
                  <input 
                    type="date" 
                    value={escrowDeadline}
                    onChange={(e) => setEscrowDeadline(e.target.value)}
                    className={styles.form__input} 
                    required
                  />
                </div>
              </div>

              <div className={styles.form__group}>
                <label className={styles.form__label}>Milestones / Detailed Task Statement</label>
                <textarea 
                  rows={4}
                  value={escrowDesc}
                  onChange={(e) => setEscrowDesc(e.target.value)}
                  placeholder="Draft clear delivery milestones. Funds are programmatically secure and require client release authorization." 
                  className={styles.form__input}
                  style={{ resize: 'vertical', fontFamily: 'var(--font-primary)' }}
                  required
                />
              </div>

              <button type="submit" className={styles.form__submit}>
                Lock Funds in Escrow Protocol
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
