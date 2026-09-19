import type { Metadata } from 'next'
import { Noto_Sans_Thai } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

const notoSansThai = Noto_Sans_Thai({ 
  subsets: ['thai'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans-thai'
})

export const metadata: Metadata = {
  title: 'ระบบจัดการอะไหล่ร้านซ่อมมอเตอร์ไซค์',
  description: 'Motorcycle parts shop management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={`${notoSansThai.variable} font-sans`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
