import './globals.css'

import Providers from '@/components/providers'
import { TooltipProvider } from '@/components/ui/tooltip'

export const metadata = {
  title: 'Business Orchestrator',
  description:
    'A business orchestration platform with AI agents powered by ChatBotKit',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  )
}
