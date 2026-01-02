import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

export const metadata = {
    title: 'KrissKross Leads CRM',
    description: 'AI-powered lead discovery and CRM for KrissKross SDRs',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
