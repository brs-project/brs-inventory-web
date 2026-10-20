import { cn } from '@lib/utils'

export type PendingTabType = 'all' | 'under' | 'partial'

export interface PendingTabBarProps {
  activeTab: PendingTabType
  onTabChange: (tab: PendingTabType) => void
  counts: {
    all: number
    under: number
    partial: number
  }
}

export function PendingTabBar({
  activeTab,
  onTabChange,
  counts,
}: PendingTabBarProps) {
  const tabs: { id: PendingTabType; label: string; count: number }[] = [
    { id: 'all', label: 'All Pending', count: counts.all },
    { id: 'under', label: 'Under Billing', count: counts.under },
    { id: 'partial', label: 'Partial Settlements', count: counts.partial },
  ]

  return (
    <div className="bg-[#F4F5F6] p-1 rounded-xl border border-[#E5E7EB]/80 inline-flex items-center gap-1 max-w-full overflow-x-auto select-none shadow-2xs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'px-3.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-2 transition-all duration-150 whitespace-nowrap',
              isActive
                ? 'bg-white text-[#111827] shadow-xs font-semibold'
                : 'text-[#4B5563] hover:text-[#111827] hover:bg-white/50'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10.5px] rounded-full font-mono font-bold transition-colors',
                isActive
                  ? 'bg-[#111827] text-white'
                  : 'bg-[#E5E7EB] text-[#4B5563]'
              )}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
