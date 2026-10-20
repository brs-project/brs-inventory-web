import { cn } from '@lib/utils'

export interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-slate-200/80',
        className
      )}
    />
  )
}

export function SkeletonKPI({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-4 w-12 rounded-md" />
      </div>
    </div>
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  cols = 6,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden',
        className
      )}
    >
      {/* Table Header Skeleton */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn('h-4', i === 0 ? 'w-12' : i === 1 ? 'w-32' : 'w-24')}
          />
        ))}
      </div>
      {/* Rows Skeleton */}
      <div className="divide-y divide-slate-100 p-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-3.5 flex items-center justify-between gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn(
                  'h-4',
                  c === 0 ? 'w-8' : c === 1 ? 'w-28' : 'w-20'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="h-64 flex items-end justify-between gap-3 pt-4 px-2">
        <Skeleton className="h-28 flex-1 rounded-t-xl" />
        <Skeleton className="h-44 flex-1 rounded-t-xl" />
        <Skeleton className="h-36 flex-1 rounded-t-xl" />
        <Skeleton className="h-56 flex-1 rounded-t-xl" />
        <Skeleton className="h-48 flex-1 rounded-t-xl" />
        <Skeleton className="h-32 flex-1 rounded-t-xl" />
        <Skeleton className="h-60 flex-1 rounded-t-xl" />
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse select-none">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>

      <SkeletonTable rows={4} cols={6} />
    </div>
  )
}
