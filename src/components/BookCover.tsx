import { cn } from '@/lib/utils'
import type { BookFormat, FallbackTone } from '@/types/arandu'

interface BookCoverProps {
  title: string
  author: string
  coverUrl?: string
  format?: BookFormat
  tone?: FallbackTone
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const TONE_MAP: Record<FallbackTone, { surface: string; muted: string; accent: string }> = {
  shadow: {
    surface: 'bg-shadow-grey text-white border-shadow-grey-800',
    muted: 'text-shadow-grey-200',
    accent: 'bg-light-green',
  },
  azure: {
    surface: 'bg-brilliant-azure-700 text-white border-brilliant-azure-800',
    muted: 'text-brilliant-azure-100',
    accent: 'bg-light-green',
  },
  peach: {
    surface: 'bg-peach-fuzz text-shadow-grey border-peach-fuzz-300',
    muted: 'text-shadow-grey-700',
    accent: 'bg-watermelon',
  },
  green: {
    surface: 'bg-surface text-shadow-grey border-border',
    muted: 'text-muted',
    accent: 'bg-light-green-600',
  },
}

export function BookCover({
  title,
  author,
  coverUrl,
  format = 'PDF',
  tone = 'shadow',
  size = 'md',
  className,
}: BookCoverProps) {
  if (coverUrl) {
    return (
      <div
        className={cn(
          'relative aspect-[2/3] w-full overflow-hidden rounded-md border border-border bg-surface shadow-sm',
          className,
        )}
      >
        <img
          src={coverUrl}
          alt={`Capa de ${title}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  const palette = TONE_MAP[tone]

  if (size === 'xs') {
    return (
      <div
        className={cn(
          'flex aspect-[2/3] w-full flex-col items-center justify-center rounded-sm border p-1.5',
          palette.surface,
          className,
        )}
        aria-label={`Capa de ${title}`}
      >
        <span className={cn('h-1.5 w-4 rounded-full', palette.accent)} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex aspect-[2/3] w-full flex-col justify-between overflow-hidden rounded-md border shadow-sm',
        size === 'lg' ? 'p-5 sm:p-6' : size === 'sm' ? 'p-3' : 'p-4',
        palette.surface,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-[11px] font-semibold uppercase tracking-wider', palette.muted)}>
          Arandu
        </span>
        <span className="rounded-xs bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">
          {format}
        </span>
      </div>

      <div className="my-auto min-w-0 py-2">
        <h4
          className={cn(
            'line-clamp-4 break-words font-bold leading-snug tracking-tight',
            size === 'lg'
              ? 'text-xl sm:text-2xl'
              : size === 'sm'
                ? 'text-[13px] sm:text-sm'
                : 'text-sm sm:text-base',
          )}
        >
          {title}
        </h4>
        <p className={cn('mt-1.5 line-clamp-2 break-words text-xs', palette.muted)}>{author}</p>
      </div>

      <span className={cn('h-1.5 w-8 rounded-full', palette.accent)} aria-hidden="true" />
    </div>
  )
}
