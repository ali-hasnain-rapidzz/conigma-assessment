import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workflow Agent',
  description: 'Temporal-backed workflow agent system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '2rem' }}>
        <main>{children}</main>
      </body>
    </html>
  );
}