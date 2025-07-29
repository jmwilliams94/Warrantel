import './globals.css'

export const metadata = {
  title: 'Warrantel - Warranty Tracker',
  description: 'Keep track of your products and warranty events',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
