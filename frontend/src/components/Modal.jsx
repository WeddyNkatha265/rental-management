import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const maxW = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`card w-full ${maxW} shadow-2xl animate-fade-in`}
        style={{ animation: 'slideUp 0.2s ease-out' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-estate-700">
          <h3 className="text-lg font-serif text-gold-300">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-estate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  )
}
