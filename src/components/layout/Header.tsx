'use client'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 h-[var(--navbar-height)] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <div className="h-7 w-7 grid place-items-center bg-sys-color-primary text-sys-color-on-primary rounded-none font-bold text-xs tracking-wide">
            LA
          </div>
          <span className="font-semibold tracking-tight">lekhAI</span>
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}


