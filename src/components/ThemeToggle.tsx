'use client'
import { useTheme } from '@/contexts/ThemeContext'
import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'

export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-yellow-500" />
      ) : (
        <Moon className="w-4 h-4 text-primary" />
      )}
      <span className="ml-2 hidden sm:inline">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </Button>
  )
}