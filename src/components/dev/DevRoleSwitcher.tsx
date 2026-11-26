// DEV ONLY: para remover em produção, delete este arquivo e remova <DevRoleSwitcher /> em src/App.tsx
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ShieldCheck } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'

export function DevRoleSwitcher() {
  const { role, isAuthenticated, setRole } = useApp()
  const navigate = useNavigate()

  const switchTo = (nextRole: 'student' | 'teacher') => {
    setRole(nextRole)
    navigate(nextRole === 'teacher' ? '/admin-acervo' : '/catalogo')
  }

  return (
    <div
      role="region"
      aria-label="Alternador de perfil de protótipo"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-shadow-grey-700 bg-shadow-grey p-1.5 text-white shadow-xl"
    >
      <span className="hidden pl-2 pr-1 text-[10px] font-bold uppercase tracking-wider text-shadow-grey-300 sm:inline">
        Prévia
      </span>

      <button
        type="button"
        onClick={() => switchTo('student')}
        aria-pressed={isAuthenticated && role === 'student'}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-focus',
          isAuthenticated && role === 'student'
            ? 'bg-accent font-semibold text-accent-foreground'
            : 'text-white/80 hover:bg-white/10 hover:text-white',
        )}
      >
        <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
        Aluno
      </button>

      <button
        type="button"
        onClick={() => switchTo('teacher')}
        aria-pressed={isAuthenticated && role === 'teacher'}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-focus',
          isAuthenticated && role === 'teacher'
            ? 'bg-accent font-semibold text-accent-foreground'
            : 'text-white/80 hover:bg-white/10 hover:text-white',
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Professor
      </button>
    </div>
  )
}
