import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '英単語フラッシュカード',
  description: 'システム英単語学習アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  )
}
