import { CheckCircle2 } from 'lucide-react'
import { cn } from '@lib/utils'

export interface BillFormProgressProps {
  filledCount: number
  totalCount?: number
}

export function BillFormProgress({
  filledCount,
  totalCount = 8,
}: BillFormProgressProps) {
  const percentage = Math.min(Math.round((filledCount / totalCount) * 100), 100)
  const isComplete = filledCount >= totalCount

  const getProgressColor = () => {
    if (percentage === 100) return 'bg-green-500'
    if (percentage >= 80) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-amber-500'
    return 'bg-red-400'
  }

  return (
    <div className="space-y-1.5 select-none">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-500">
          Form Completion
        </span>
        <span className="font-mono font-bold text-slate-700">
          {filledCount}/{totalCount} fields ({percentage}%)
        </span>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            getProgressColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isComplete ? (
        <p className="text-xs font-bold text-green-600 flex items-center gap-1 mt-1 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>All required fields completed &bull; Ready to save</span>
        </p>
      ) : (
        <p className="text-[11px] text-slate-400 mt-0.5">
          Fill remaining {totalCount - filledCount} required {totalCount - filledCount === 1 ? 'field' : 'fields'} to complete
        </p>
      )}
    </div>
  )
}

export default BillFormProgress
