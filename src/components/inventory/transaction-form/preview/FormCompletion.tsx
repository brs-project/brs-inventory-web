export interface FormCompletionProps {
  completedFields: number
  totalFields: number
}

export function FormCompletion({ completedFields, totalFields = 5 }: FormCompletionProps) {
  const percentage = Math.min(100, Math.round((completedFields / totalFields) * 100))

  return (
    <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 space-y-1.5 select-none">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">Form Completion</span>
        <span className="font-bold font-mono text-blue-600">{percentage}%</span>
      </div>

      <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>
          {completedFields} of {totalFields} required fields filled
        </span>
        {percentage === 100 && (
          <span className="text-emerald-600 font-bold">Ready to submit</span>
        )}
      </div>
    </div>
  )
}

export default FormCompletion
