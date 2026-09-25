'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Clock, 
  Check, 
  AlertTriangle, 
  User, 
  Lock, 
  DollarSign, 
  Send, 
  ArrowUpRight, 
  ArrowDownLeft,
  FileText,
  Calendar,
  Briefcase,
  CreditCard
} from 'lucide-react';
import styles from './Vault.module.scss';

// Type definitions matching requirements
interface EscrowDeal {
  id: string;
  freelancer: string;
  client: string;
  amount: number;
  deadline: string;
  description: string;
  status: 'Funds Locked' | 'Under Review' | 'Disputed' | 'Completed' | 'FUNDS LOCKED' | 'UNDER REVIEW' | 'DISPUTED' | 'COMPLETED';
  createdAt: string;
}

interface BillingInvoice {
  id: string;
  partner: string;
  amount: number;
  deadline: string;
  status: 'PAID' | 'PENDING';
  description: string;
}

interface PayrollItem {
  id: string;
  dept: string;
  amount: number;
  status: 'Processing via FlowPay Stream' | 'Scheduled';
}

export default function EscrowVault() {
  // Main Tab State
  const [activeTab, setActiveTab] = useState<'escrows' | 'billing'>('escrows');

  // B2B Secure Escrows State
  const [activeSubTab, setActiveSubTab] = useState<'incoming' | 'outgoing'>('outgoing');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Managed Form states for B2B Secure Escrow
  const [freelancerAddress, setFreelancerAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('2026-06-30');
  const [taskDescription, setTaskDescription] = useState('');

  // Initial Seed B2B Escrows (containing the two deals you previously modeled, set as default state values)
  const [escrows, setEscrows] = useState<EscrowDeal[]>([
    {
      id: 'ESC-4091',
      freelancer: 'arc1freelancer82v4p89znsh77xmqpl78p9vpy6s2g94h',
      client: 'arc1client3pv4g89znnn77xmqpqqqp9vpy8u3yy3k',
      amount: 4200.00,
      deadline: '2026-06-15',
      description: 'Design UI mockup and SCSS integration for FlowPay App Router platform.',
      status: 'FUNDS LOCKED',
      createdAt: '2026-05-24'
    },
    {
      id: 'ESC-4089',
      freelancer: 'arc1freelancer82v4p89znsh77xmqpl78p9vpy6s2g94h',
      client: 'arc1client3pv4g89znnn77xmqpqqqp9vpy8u3yy3k',
      amount: 8500.00,
      deadline: '2026-06-20',
      description: 'Smart contract deployment on Arc mainnet and validation protocol integration tests.',
      status: 'UNDER REVIEW',
      createdAt: '2026-05-22'
    }
  ]);

  // Corporate Billing & Payroll States
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  
  // Managed Form states for Corporate Billing
  const [billingPartner, setBillingPartner] = useState('');
  const [billingAmount, setBillingAmount] = useState('');
  const [billingDeadline, setBillingDeadline] = useState('2026-06-15');
  const [billingDescription, setBillingDescription] = useState('');

  // Initial Seed Corporate Invoices
  const [billingInvoices, setBillingInvoices] = useState<BillingInvoice[]>([
    {
      id: 'INV-802',
      partner: 'ArcScan Explorer Services',
      amount: 5000.00,
      deadline: '2026-06-10',
      status: 'PENDING',
      description: 'API Integration, node querying, and daily block latency reports for FlowPay.'
    },
    {
      id: 'INV-801',
      partner: 'Liquidity Node Providers',
      amount: 12500.00,
      deadline: '2026-06-05',
      status: 'PENDING',
      description: 'Smart contract liquidity provisioning and gas fee optimization services.'
    },
    {
      id: 'INV-798',
      partner: 'Sphera Web3 Security LLC',
      amount: 3700.00,
      deadline: '2026-05-20',
      status: 'PAID',
      description: 'Complete audit of native multi-signature wallets & time-locked escrow contracts.'
    }
  ]);

  // Initial Seed Payroll calendar
  const [payrollStreams, setPayrollStreams] = useState<PayrollItem[]>([
    {
      id: 'PAY-101',
      dept: 'Core DevOps Devs',
      amount: 9800.00,
      status: 'Processing via FlowPay Stream'
    },
    {
      id: 'PAY-102',
      dept: 'Marketing & PR Layer',
      amount: 4500.00,
      status: 'Scheduled'
    },
    {
      id: 'PAY-103',
      dept: 'Lead Blockchain Architect',
      amount: 12000.00,
      status: 'Processing via FlowPay Stream'
    },
    {
      id: 'PAY-104',
      dept: 'Global Community Moderators',
      amount: 2800.00,
      status: 'Scheduled'
    }
  ]);

  // Current User address simulation
  const currentUserAddress = 'arc1client3pv4g89znnn77xmqpqqqp9vpy8u3yy3k';

  // Create Escrow logic
  const handleCreateEscrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!freelancerAddress || !amount || !taskDescription) return;

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    // Generate a secure new unique ID pattern like ESC-4092
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    const newId = `ESC-${randomSuffix}`;

    const newEscrow: EscrowDeal = {
      id: newId,
      freelancer: freelancerAddress,
      client: currentUserAddress,
      amount: amt,
      deadline: deadline || '2026-06-30',
      description: taskDescription,
      status: 'FUNDS LOCKED',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setEscrows([newEscrow, ...escrows]);
    setIsModalOpen(false);

    // Reset Form fields
    setFreelancerAddress('');
    setAmount('');
    setTaskDescription('');
    setDeadline('2026-06-30');
  };

  // Create Billing Invoice logic
  const handleCreateBillingInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingPartner || !billingAmount || !billingDescription) return;

    const amt = parseFloat(billingAmount);
    if (isNaN(amt) || amt <= 0) return;

    // Generate a secure new unique ID pattern like INV-805
    const randomSuffix = Math.floor(Math.random() * 200) + 800;
    const newId = `INV-${randomSuffix}`;

    const newInvoice: BillingInvoice = {
      id: newId,
      partner: billingPartner,
      amount: amt,
      deadline: billingDeadline || '2026-06-15',
      status: 'PENDING',
      description: billingDescription
    };

    setBillingInvoices([newInvoice, ...billingInvoices]);
    setIsBillingModalOpen(false);

    // Reset Form fields
    setBillingPartner('');
    setBillingAmount('');
    setBillingDescription('');
    setBillingDeadline('2026-06-15');
  };

  // Pay corporate invoice
  const handlePayBillingInvoice = (id: string) => {
    setBillingInvoices(prev =>
      prev.map(inv =>
        inv.id === id ? { ...inv, status: 'PAID' } : inv
      )
    );
  };

  // Toggle Payroll payment status (Acre / Stream / Scheduled)
  const togglePayrollStatus = (id: string) => {
    setPayrollStreams(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextStatus = item.status === 'Scheduled' 
            ? 'Processing via FlowPay Stream' 
            : 'Scheduled';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  // Status Handlers for Escrows
  const handleReleaseFunds = (dealId: string) => {
    setEscrows(prev =>
      prev.map(deal =>
        deal.id === dealId ? { ...deal, status: 'Completed' } : deal
      )
    );
  };

  const handleDispute = (dealId: string) => {
    setEscrows(prev =>
      prev.map(deal =>
        deal.id === dealId ? { ...deal, status: 'Disputed' } : deal
      )
    );
  };

  const handleSubmitWork = (dealId: string) => {
    setEscrows(prev =>
      prev.map(deal =>
        deal.id === dealId ? { ...deal, status: 'Under Review' } : deal
      )
    );
  };

  // Filter deals depending on Active Subtab Role Standard
  const filteredDeals = escrows.filter(deal => {
    if (activeSubTab === 'incoming') {
      return deal.freelancer === 'arc1freelancer82v4p89znsh77xmqpl78p9vpy6s2g94h';
    } else {
      return deal.client === currentUserAddress;
    }
  });

  return (
    <div className={styles.container}>
      {/* Decorative Blur Backgrounds */}
      <div className={styles.backgroundGlow} />

      {/* Top Navigation Tabs */}
      <div className={styles.mainTabs}>
        <button
          onClick={() => setActiveTab('escrows')}
          className={`${styles.mainTabsBtn} ${activeTab === 'escrows' ? styles.mainTabsBtnActive : ''}`}
          id="main-tab-escrows"
        >
          <ShieldCheck size={16} />
          <span>B2B Secure Escrows</span>
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`${styles.mainTabsBtn} ${activeTab === 'billing' ? styles.mainTabsBtnActive : ''}`}
          id="main-tab-billing"
        >
          <FileText size={16} />
          <span>Invoices & Corporate Billing</span>
        </button>
      </div>

      {activeTab === 'escrows' ? (
        /* B2B SECURE ESCROW SECTION */
        <>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <h1 className={styles.title} id="escrow-header-title">
                <ShieldCheck className={styles.shieldIcon} /> B2B Secure Escrow Vault
              </h1>
              <p className={styles.subtitle}>
                Bypass trust barriers by establishing decentralized, cryptographically-locked milestone deposits on the Arc blockchain network.
              </p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className={styles.createBtn}
              id="btn-new-escrow-protocol"
            >
              <Plus size={16} />
              <span>New Escrow Protocol</span>
            </button>
          </div>

          {/* Escrow Role Tabs Switcher */}
          <div className={styles.subtabs} id="escrow-tab-switcher">
            <button
              onClick={() => setActiveSubTab('outgoing')}
              className={`${styles.subtabsBtn} ${activeSubTab === 'outgoing' ? styles.subtabsBtnActive : ''}`}
              id="tab-role-outgoing"
            >
              <ArrowUpRight size={16} />
              <span>My Outgoing Escrows (Client)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('incoming')}
              className={`${styles.subtabsBtn} ${activeSubTab === 'incoming' ? styles.subtabsBtnActive : ''}`}
              id="tab-role-incoming"
            >
              <ArrowDownLeft size={16} />
              <span>My Incoming Escrows (Freelancer)</span>
            </button>
          </div>

          {/* Grid of Active Deals */}
          <div className={styles.grid} id="escrows-data-grid">
            {filteredDeals.map((deal) => (
              <div key={deal.id} className={styles.dealCard} id={`deal-card-${deal.id}`}>
                {/* Card Header & Status Info */}
                <div className={styles.dealHeader}>
                  <span className={styles.dealId}>{deal.id}</span>
                  <span className={`${styles.statusBadge} ${
                    (deal.status === 'Completed' || deal.status === 'COMPLETED') ? styles.statusSuccess :
                    (deal.status === 'Under Review' || deal.status === 'UNDER REVIEW') ? styles.statusPending :
                    (deal.status === 'Disputed' || deal.status === 'DISPUTED') ? styles.statusDanger : styles.statusLocked
                  }`}>
                    {deal.status}
                  </span>
                </div>

                {/* Cryptocurrency Address Metadata */}
                <div className={styles.dealMeta}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Freelancer Address:</span>
                    <span className={styles.metaValueMono}>{deal.freelancer.slice(0, 14)}...{deal.freelancer.slice(-10)}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Client Address:</span>
                    <span className={styles.metaValueMono}>{deal.client.slice(0, 14)}...{deal.client.slice(-10)}</span>
                  </div>
                </div>

                <div className={styles.dealBody}>
                  <p className={styles.dealDesc}>{deal.description}</p>
                </div>

                {/* Escrow Sizing / Stats */}
                <div className={styles.dealMetrics}>
                  <div className={styles.metricBlock}>
                    <span className={styles.metricLabel}>Amount locked</span>
                    <span className={styles.amountValue}>
                      {deal.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className={styles.currency}>USDC</span>
                    </span>
                  </div>
                  <div className={styles.metricBlock}>
                    <span className={styles.metricLabel}>Deadline limit</span>
                    <span className={styles.deadlineValue}>
                      <Clock size={12} /> {deal.deadline}
                    </span>
                  </div>
                </div>

                {/* Practical Multi-Role action controllers */}
                <div className={styles.dealFooter}>
                  {deal.status !== 'Completed' && deal.status !== 'COMPLETED' && (
                    <>
                      {activeSubTab === 'outgoing' ? (
                        /* Act as CLIENT: Release funds or launch secure dispute */
                        <div className={styles.actionGroup}>
                          <button 
                            onClick={() => handleReleaseFunds(deal.id)}
                            className={styles.releaseBtn}
                            id={`btn-release-funds-${deal.id}`}
                          >
                            <Check size={14} />
                            <span>Release Funds</span>
                          </button>
                          {deal.status !== 'Disputed' && deal.status !== 'DISPUTED' && (
                            <button 
                              onClick={() => handleDispute(deal.id)}
                              className={styles.disputeBtn}
                              id={`btn-dispute-funds-${deal.id}`}
                            >
                              <AlertTriangle size={14} />
                              <span>Dispute Transaction</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        /* Act as FREELANCER: Submit work or view status info */
                        <div className={styles.actionGroup}>
                          {(deal.status === 'Funds Locked' || deal.status === 'FUNDS LOCKED') && (
                            <button 
                              onClick={() => handleSubmitWork(deal.id)}
                              className={styles.submitWorkBtn}
                              id={`btn-submit-work-${deal.id}`}
                            >
                              <Send size={14} />
                              <span>Submit Work</span>
                            </button>
                          )}
                          {(deal.status === 'Under Review' || deal.status === 'UNDER REVIEW') && (
                            <span className={styles.waitingNotice}>
                              Under verification by employer
                            </span>
                          )}
                          {(deal.status === 'Disputed' || deal.status === 'DISPUTED') && (
                            <span className={styles.disputeNotice}>
                              Escrow disputed. Arc arbitration pending.
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {(deal.status === 'Completed' || deal.status === 'COMPLETED') && (
                    <div className={styles.completedNotice}>
                      <Check size={14} /> Paid & Disbursed on Blockchain
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredDeals.length === 0 && (
              <div className={styles.emptyState}>
                <ShieldCheck size={48} className={styles.emptyIcon} />
                <p className={styles.emptyText}>No escrow agreements matching specified role standard.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* CORPORATE BILLING & AUTOMATED PAYROLL DASHBOARD */
        <>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <h1 className={styles.title} id="billing-header-title">
                <Briefcase className={styles.shieldIcon} /> Corporate Billing & Payroll Dashboard
              </h1>
              <p className={styles.subtitle}>
                Manage corporate invoices, automated payroll streams, and bulk B2B settlements on the Arc network.
              </p>
            </div>
            <button 
              onClick={() => setIsBillingModalOpen(true)}
              className={styles.createBtn}
              id="btn-issue-corporate-invoice"
            >
              <Plus size={16} />
              <span>Issue Corporate Invoice</span>
            </button>
          </div>

          {/* Section 1: Incoming B2B Invoices */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FileText size={20} color="var(--accent-primary)" /> Incoming B2B Invoices
            </h2>
            <div className={styles.tableContainer}>
              <table className={styles.billingTable}>
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Enterprise Partner</th>
                    <th>Service Milestones</th>
                    <th>Limit Deadline</th>
                    <th>Sizing</th>
                    <th>Ledger Status</th>
                    <th>Secure Disbursement</th>
                  </tr>
                </thead>
                <tbody>
                  {billingInvoices.map((inv) => (
                    <tr key={inv.id} id={`row-invoice-${inv.id}`}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem' }}>{inv.id}</td>
                      <td>
                        <span className={styles.companyName}>{inv.partner}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxSize: '320px', fontSize: '0.85rem' }}>
                        {inv.description}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={12} /> {inv.deadline}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>USDC</span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          inv.status === 'PAID' ? styles.statusSuccess : styles.statusPending
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td>
                        {inv.status === 'PENDING' ? (
                          <button
                            onClick={() => handlePayBillingInvoice(inv.id)}
                            className={styles.actionBtn}
                            id={`btn-pay-invoice-${inv.id}`}
                          >
                            <CreditCard size={12} />
                            <span>Clear Bill</span>
                          </button>
                        ) : (
                          <div style={{ color: 'var(--status-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                            <Check size={14} /> Settlement Complete
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Automated Payroll Calendar */}
          <div className={styles.section} style={{ marginTop: '16px' }}>
            <h2 className={styles.sectionTitle}>
              <Calendar size={20} color="var(--accent-primary)" /> Automated Payroll Calendar
            </h2>
            <div className={styles.payrollGrid} id="payroll-grid-container">
              {payrollStreams.map((item) => (
                <div key={item.id} className={styles.payrollCard} id={`payroll-card-${item.id}`}>
                  <div className={styles.payrollHeader}>
                    <h3 className={styles.payrollDept}>{item.dept}</h3>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.id}</span>
                  </div>

                  <div className={styles.payrollAmount}>
                    <span className={styles.payrollLabel}>Monthly base oklad</span>
                    <span className={styles.payrollVal}>
                      {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span style={{ fontSize: '0.825rem', color: 'var(--accent-primary)' }}>USDC</span>
                    </span>
                  </div>

                  <div className={styles.payrollStatusWrapper}>
                    <div className={styles.payrollStatus}>
                      <span style={{ 
                        height: '8px', 
                        width: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: item.status === 'Processing via FlowPay Stream' ? '#10B981' : '#F59E0B',
                        display: 'inline-block'
                      }} />
                      <span className={item.status === 'Processing via FlowPay Stream' ? styles.payrollStatusActive : styles.payrollStatusScheduled}>
                        {item.status}
                      </span>
                    </div>

                    <button
                      onClick={() => togglePayrollStatus(item.id)}
                      className={styles.actionBtn}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      id={`btn-toggle-payroll-${item.id}`}
                    >
                      {item.status === 'Scheduled' ? 'Launch Stream' : 'Pause Stream'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ESCROW INITIALIZATION MODAL */}
      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent} id="escrow-modal">
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Establish Secure Cryptographic Escrow</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className={styles.modalClose}
                id="modal-close-btn"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateEscrow} className={styles.form} id="escrow-create-form">
              <div className={styles.formGroup}>
                <label className={styles.label}>Freelancer Public Arc Key</label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
                  <input 
                    type="text" 
                    value={freelancerAddress}
                    onChange={(e) => setFreelancerAddress(e.target.value)}
                    placeholder="arc1freelancer..." 
                    className={styles.input} 
                    id="input-freelancer-address"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Locked Escrow Deposit (USDC)</label>
                  <div className={styles.inputWrapper}>
                    <DollarSign size={16} className={styles.inputIcon} />
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 5000" 
                      className={styles.input} 
                      id="input-escrow-amount"
                      required
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Agreement Deadline</label>
                  <div className={styles.inputWrapper}>
                    <Clock size={16} className={styles.inputIcon} />
                    <input 
                      type="date" 
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className={styles.input} 
                      id="input-escrow-deadline"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Milestones / Detailed Task Statement</label>
                <textarea 
                  rows={4}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Draft clear delivery milestones. Funds are programmatically secure and require client release authorization or smart arbiter split standard." 
                  className={styles.textarea}
                  id="textarea-task-description"
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} id="button-submit-escrow">
                <Lock size={16} /> <span>Lock Funds in Escrow</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CORPORATE INVOICE MODAL */}
      {isBillingModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent} id="billing-modal">
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Issue Corporate Invoice</h3>
              <button 
                onClick={() => setIsBillingModalOpen(false)} 
                className={styles.modalClose}
                id="billing-modal-close-btn"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateBillingInvoice} className={styles.form} id="billing-create-form">
              <div className={styles.formGroup}>
                <label className={styles.label}>Enterprise Partner / Issuer</label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
                  <input 
                    type="text" 
                    value={billingPartner}
                    onChange={(e) => setBillingPartner(e.target.value)}
                    placeholder="e.g. ArcScan Explorer Services" 
                    className={styles.input} 
                    id="input-billing-partner"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Invoice Amount (USDC)</label>
                  <div className={styles.inputWrapper}>
                    <DollarSign size={16} className={styles.inputIcon} />
                    <input 
                      type="number" 
                      value={billingAmount}
                      onChange={(e) => setBillingAmount(e.target.value)}
                      placeholder="e.g. 5000" 
                      className={styles.input} 
                      id="input-billing-amount"
                      required
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Payment Limit Deadline</label>
                  <div className={styles.inputWrapper}>
                    <Clock size={16} className={styles.inputIcon} />
                    <input 
                      type="date" 
                      value={billingDeadline}
                      onChange={(e) => setBillingDeadline(e.target.value)}
                      className={styles.input} 
                      id="input-billing-deadline"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Service / Milestone Specifications</label>
                <textarea 
                  rows={4}
                  value={billingDescription}
                  onChange={(e) => setBillingDescription(e.target.value)}
                  placeholder="Describe rendered node infrastructure, development, PR support, or custom B2B audits clearly." 
                  className={styles.textarea}
                  id="textarea-billing-description"
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} id="button-submit-billing">
                <Lock size={16} /> <span>Issue and Register Bill</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
