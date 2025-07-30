import './globals.css'

export const metadata = {
  title: 'Warrantel - Warranty Tracker',
  description: 'Keep track of your products and warranty events',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        
        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Warrantel" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        
        {/* Android PWA - These are key! */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Warrantel" />
        
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
