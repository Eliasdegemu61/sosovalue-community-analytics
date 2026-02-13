import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Lora } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _lora = Lora({ subsets: ["latin"], variable: "--font-serif" })

export const metadata: Metadata = {
  title: "SoSovalue and SoDex",
  description: "Analytics archive",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'><circle cx='128' cy='128' r='126' fill='%23FF5722'/><path d='M80 90c-18 0-32 14-32 32v50c0 6 4 11 10 11h40l20 20v-20h28c6 0 10-5 10-11V122c0-18-14-32-32-32H80z' fill='%23FFFFFF'/><circle cx='100' cy='125' r='4' fill='%23FF5722'/><circle cx='128' cy='125' r='4' fill='%23FF5722'/><circle cx='156' cy='125' r='4' fill='%23FF5722'/></svg>",
        type: "image/svg+xml",
      },
    ],
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'><circle cx='128' cy='128' r='126' fill='%23FF5722'/><path d='M80 90c-18 0-32 14-32 32v50c0 6 4 11 10 11h40l20 20v-20h28c6 0 10-5 10-11V122c0-18-14-32-32-32H80z' fill='%23FFFFFF'/><circle cx='100' cy='125' r='4' fill='%23FF5722'/><circle cx='128' cy='125' r='4' fill='%23FF5722'/><circle cx='156' cy='125' r='4' fill='%23FF5722'/></svg>",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
