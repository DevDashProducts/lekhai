'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Built by <span className="text-primary font-medium">DevDash Labs</span>
        </p>
        <div className="text-xs text-muted-foreground flex items-center gap-4">
          <Link href="/" className="hover:text-foreground">Privacy</Link>
          <span className="opacity-30">|</span>
          <Link href="/" className="hover:text-foreground">Terms</Link>
        </div>
      </div>
    </footer>
  )
}


