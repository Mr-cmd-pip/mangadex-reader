import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { themeInitScript } from '@/lib/theme';

export const metadata = {
  title: 'MangaVerse — Ad-Free Manga, Manhwa & Manhua Reader',
  description:
    'A high-performance, ad-free reader for Manga, Manhwa, and Manhua powered by the MangaDex API with proxied image delivery and strict rate-limiting compliance.',
  metadataBase: new URL('http://localhost:3000'),
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#090a0f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-type="software">
      <head>
        <meta name="page-type" content="software" />
        <meta name="site-kind" content="software" />
        {/* Anti-FOUC inline script executed before first render */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-canvas text-text-main min-h-screen flex flex-col antialiased selection:bg-orange-500 selection:text-white">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
