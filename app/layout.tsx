import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "StreamVault — Subscription Tracker",
  description: "Track your streaming subscriptions and maximize credit card rewards",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050913] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
