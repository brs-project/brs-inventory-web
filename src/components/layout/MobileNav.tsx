import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Sidebar } from './Sidebar'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  // Prevent background body scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Semi-transparent Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer Container */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0C0E14] border-r border-[#1C202E] shadow-2xl z-50 animate-in slide-in-from-left duration-200 ease-out">
        {/* Close Button at Top Right */}
        <div className="absolute top-3.5 right-3.5 z-50">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition focus:outline-none focus:ring-1 focus:ring-white/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Content (Passes onClose to close drawer on item click) */}
        <Sidebar onItemClick={onClose} className="w-full shadow-none" />
      </div>
    </div>
  )
}

export default MobileNav
