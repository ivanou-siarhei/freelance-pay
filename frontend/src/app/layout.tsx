import type { Metadata } from 'next';
import Sidebar from '../components/Sidebar';
import './globals.scss';

export const metadata: Metadata = {
  title: 'FlowPay B2B Protocol - Arc Blockchain',
  description: 'Frontend-First development of FlowPay B2B Invoice Vault and Real-Time Payments Stream Manager on the Arc Blockchain.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body data-theme="dark">
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <div style={{ flex: 1, paddingLeft: '260px', display: 'flex', flexDirection: 'column' }}>
            <header
              style={{
                height: '70px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 32px',
                backgroundColor: 'var(--bg-secondary)',
                position: 'sticky',
                top: 0,
                zIndex: 90,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>B2B Payment Gateway /</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Arc Mainnet</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-color)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    transition: 'var(--transition-smooth)',
                  }}
                >
                  Switch Theme
                </button>
                <div
                  style={{
                    backgroundColor: 'rgba(88, 80, 236, 0.1)',
                    border: '1px solid rgba(88, 80, 236, 0.2)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                  }}
                >
                  Protocol active
                </div>
              </div>
            </header>
            <main style={{ padding: '32px', flex: 1, backgroundColor: 'var(--bg-primary)' }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
