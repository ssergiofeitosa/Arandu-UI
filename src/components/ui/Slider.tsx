import * as React from 'react'
import {
  Label as AriaLabel,
  Slider as AriaSlider,
  SliderOutput as AriaSliderOutput,
  SliderStateContext,
  SliderThumb as AriaSliderThumb,
  SliderTrack as AriaSliderTrack,
  type LabelProps,
  type SliderOutputProps,
  type SliderProps,
  type SliderThumbProps,
  type SliderTrackProps,
} from 'react-aria-components'
import { cn } from '@/lib/utils'

function SliderRoot<T extends number | number[]>(
  { className, ...props }: SliderProps<T>,
) {
  return (
    <AriaSlider
      className={cn('flex w-full flex-col gap-2.5', className)}
      {...props}
    />
  )
}

function SliderLabel({ className, ...props }: LabelProps) {
  return (
    <AriaLabel
      className={cn('text-xs font-semibold text-foreground', className)}
      {...props}
    />
  )
}

function SliderOutput({ className, ...props }: SliderOutputProps) {
  return (
    <AriaSliderOutput
      className={cn('text-xs font-medium tabular-nums text-muted', className)}
      {...props}
    />
  )
}

function SliderTrack({ className, children, ...props }: SliderTrackProps) {
  return (
    <AriaSliderTrack
      className={cn(
        'relative flex h-6 w-full cursor-pointer touch-none select-none items-center',
        className,
      )}
      {...props}
    >
      {(renderProps) => (
        <>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-default">
            {typeof children === 'function' ? children(renderProps) : children}
          </div>
          <SliderThumbInternal />
        </>
      )}
    </AriaSliderTrack>
  )
}

function SliderThumbInternal({ className, ...props }: SliderThumbProps) {
  return (
    <AriaSliderThumb
      className={cn(
        'top-1/2 block h-5 w-5 cursor-grab rounded-full border-2 border-shadow-grey bg-surface shadow-sm transition-transform duration-150 hover:scale-110 active:cursor-grabbing active:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-secondary',
        className,
      )}
      {...props}
    />
  )
}

function SliderFill({ className }: { className?: string }) {
  const state = React.useContext(SliderStateContext)
  const percent = state ? state.getThumbPercent(0) * 100 : 0

  return (
    <div
      style={{ width: `${percent}%` }}
      className={cn(
        'pointer-events-none absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-150',
        className,
      )}
    />
  )
}

function SliderTrackSimple({
  className,
  children,
  ...props
}: Omit<SliderTrackProps, 'children'> & { children?: React.ReactNode }) {
  return (
    <AriaSliderTrack
      className={cn(
        'relative flex h-6 w-full cursor-pointer touch-none select-none items-center',
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-default">
        <SliderFill />
      </div>
      {children}
    </AriaSliderTrack>
  )
}

export const Slider = Object.assign(SliderRoot, {
  Label: SliderLabel,
  Output: SliderOutput,
  Track: SliderTrackSimple,
  TrackWithThumb: SliderTrack,
  Fill: SliderFill,
  Thumb: SliderThumbInternal,
})
