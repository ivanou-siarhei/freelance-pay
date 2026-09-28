import React from 'react';
import { AlertTriangle, Check, Clock, Send, Undo2, Scale, Wallet } from 'lucide-react';
import type { Role } from '../context/WalletContext';
import { DISPUTE_TIMEOUT_SEC, EscrowDeal, EscrowStatus, formatUsdc, REVIEW_PERIOD_SEC, shortAddr, STATUS_LABEL } from '../lib/arc';
import styles from '../App.module.scss';

type Action =
  | 'releaseFunds'
  | 'refundAfterDeadline'
  | 'submitWork'
  | 'claimAfterReview'
  | 'refundByFreelancer'
  | 'initiateDispute'
  | 'resolveDisputeByTimeout';

interface Props {
  deal: EscrowDeal;
  role: Role;
  pending: string | null;
  onAction: (a: Action, id: bigint) => void;
}

const fmtDate = (sec: number) => new Date(sec * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

const badgeClass = (s: EscrowStatus) =>
  s === EscrowStatus.Completed || s === EscrowStatus.Resolved
    ? styles['badge--success']
    : s === EscrowStatus.Disputed
    ? styles['badge--danger']
    : styles['badge--pending'];

export default function EscrowCard({ deal, role, pending, onAction }: Props) {
  const now = Math.floor(Date.now() / 1000);
  const busy = (a: Action) => pending === `${a}:${deal.id}`;
  const anyBusy = pending !== null;

  const Btn = ({ a, label, icon, primary, danger, confirm }: { a: Action; label: string; icon: React.ReactNode; primary?: boolean; danger?: boolean; confirm?: boolean }) => (
    <button
      disabled={anyBusy}
      onClick={() => {
        if ((danger || confirm) && !window.confirm(`${label}? This sends an on-chain transaction.`)) return;
        onAction(a, deal.id);
      }}
      className={`${styles.btn} ${primary ? styles['btn--primary'] : ''} ${danger ? styles['btn--danger'] : ''}`}
      style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: 10 }}
    >
      {icon}
      <span>{busy(a) ? 'Confirm in wallet...' : label}</span>
    </button>
  );

  const reviewEnds = deal.submittedAt + REVIEW_PERIOD_SEC;
  const disputeEnds = deal.disputedAt + DISPUTE_TIMEOUT_SEC;
  const s = deal.status;
  const open = s === EscrowStatus.FundsLocked || s === EscrowStatus.WorkSubmitted;

  let hint: string | null = null;
  const actions: React.ReactNode[] = [];

  if (role === 'client') {
    if (open) actions.push(<Btn key="rel" a="releaseFunds" label="Release Funds" icon={<Check size={14} />} primary confirm />);
    if (s === EscrowStatus.FundsLocked && now > deal.deadline)
      actions.push(<Btn key="ref" a="refundAfterDeadline" label="Refund (deadline missed)" icon={<Undo2 size={14} />} danger />);
    if (open) actions.push(<Btn key="dis" a="initiateDispute" label="Open Dispute" icon={<AlertTriangle size={14} />} danger />);
    if (s === EscrowStatus.WorkSubmitted)
      hint = `Work submitted. If you don't release or dispute before ${fmtDate(reviewEnds)}, the freelancer can claim payment.`;
  } else {
    if (s === EscrowStatus.FundsLocked && now <= deal.deadline)
      actions.push(<Btn key="sub" a="submitWork" label="Submit Completed Work" icon={<Send size={14} />} primary />);
    if (s === EscrowStatus.FundsLocked && now > deal.deadline) hint = 'Deadline passed without submission: the client can refund.';
    if (s === EscrowStatus.WorkSubmitted) {
      if (now >= reviewEnds) actions.push(<Btn key="clm" a="claimAfterReview" label="Claim Payment" icon={<Wallet size={14} />} primary />);
      else hint = `Awaiting client review. You can claim after ${fmtDate(reviewEnds)}.`;
    }
    if (open) actions.push(<Btn key="dis" a="initiateDispute" label="Open Dispute" icon={<AlertTriangle size={14} />} danger />);
    if (open || s === EscrowStatus.Disputed)
      actions.push(<Btn key="cnl" a="refundByFreelancer" label="Cancel & Refund Client" icon={<Undo2 size={14} />} danger />);
  }

  if (s === EscrowStatus.Disputed) {
    if (now >= disputeEnds) actions.push(<Btn key="tmo" a="resolveDisputeByTimeout" label="Split 50/50 (arbiter timeout)" icon={<Scale size={14} />} danger />);
    else hint = `Dispute open. Arbiter decides; if no decision by ${fmtDate(disputeEnds)}, either side can split 50/50.`;
  }

  return (
    <div className={`flowpay-glass ${styles.escrowCard}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-muted)' }}>ESC-{deal.id.toString()}</span>
        <span className={`${styles.badge} ${badgeClass(s)}`}>{STATUS_LABEL[s]}</span>
      </div>

      <div className={styles.escrowCard__parties}>
        <div>
          <span>{role === 'client' ? 'Freelancer' : 'Client'}:</span>
          <span style={{ fontFamily: 'var(--font-mono)' }} title={role === 'client' ? deal.freelancer : deal.client}>
            {shortAddr(role === 'client' ? deal.freelancer : deal.client)}
          </span>
        </div>
      </div>

      {/* описание рендерится как текст: React экранирует, XSS невозможен */}
      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4, margin: 0, wordBreak: 'break-word' }}>{deal.description}</p>

      <div className={styles.escrowCard__stats}>
        <div>
          <span>Amount Locked</span>
          <strong>
            {formatUsdc(deal.amount)} <em>USDC</em>
          </strong>
        </div>
        <div>
          <span>Deadline</span>
          <strong style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
            <Clock size={12} /> {fmtDate(deal.deadline)}
          </strong>
        </div>
      </div>

      {hint && <div className={styles.notice}>{hint}</div>}

      {actions.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>
      ) : (
        !hint && (
          <div className={styles.notice} style={{ color: 'var(--status-success)' }}>
            <Check size={14} /> Settled on-chain
          </div>
        )
      )}
    </div>
  );
}
