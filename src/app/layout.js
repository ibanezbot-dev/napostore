import './globals.css';

export const metadata = {
  title: 'NapoStore — Tu tienda online',
  description: 'Descubre los mejores productos en NapoStore. Compras online seguras, rápidas y convenientes.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'NapoStore — Tu tienda online',
    description: 'Descubre los mejores productos en NapoStore.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
