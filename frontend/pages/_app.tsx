import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/context/AuthContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      {/* ⚠️ QUAN TRỌNG: Không bọc MainLayout ở đây nếu trong index.tsx đã bọc rồi */}
      <Component {...pageProps} />
    </AuthProvider>
  )
}