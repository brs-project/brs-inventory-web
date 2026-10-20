import React from 'react'
import { cn } from '@lib/utils'

export interface TransactionFormLayoutProps {
  formContent: React.ReactNode
  previewContent: React.ReactNode
  className?: string
}

export function TransactionFormLayout({
  formContent,
  previewContent,
  className,
}: TransactionFormLayoutProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px] gap-6 items-start',
        className
      )}
    >
      {/* Left Column (65%): Stacked Form Sections */}
      <div className="space-y-4 min-w-0 pb-16 lg:pb-0">{formContent}</div>

      {/* Right Column (35%): Sticky Live Preview Panel */}
      <div className="sticky top-6">{previewContent}</div>
    </div>
  )
}

export default TransactionFormLayout
