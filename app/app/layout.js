export const metadata = {
  title: 'Options IV Dashboard',
  description: 'Track implied volatility for options trading',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
