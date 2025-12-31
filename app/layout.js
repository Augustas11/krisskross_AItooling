import './globals.css'

export const metadata = {
    title: 'KrissKross Pitch Generator',
    description: 'AI-powered pitch generator for KrissKross',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                {children}
            </body>
        </html>
    )
}
