import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

// Dialog Context
const DialogContext = React.createContext()

// Main Dialog Component
export const Dialog = ({ open, onOpenChange, children }) => {
  const [isOpen, setIsOpen] = useState(open || false)

  useEffect(() => {
    setIsOpen(open || false)
  }, [open])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = () => {
    setIsOpen(false)
    onOpenChange?.(false)
  }

  if (!isOpen) return null

  return (
    <DialogContext.Provider value={{ isOpen, onClose: handleClose }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Dialog Content Container */}
        <div className="relative z-10 w-full max-w-lg mx-4">
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  )
}

// Dialog Content
export const DialogContent = ({ className = '', children, ...props }) => {
  return (
    <div 
      className={`
        bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden
        transform transition-all duration-200 scale-100
        ${className}
      `}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  )
}

// Dialog Header
export const DialogHeader = ({ className = '', children, ...props }) => {
  const { onClose } = React.useContext(DialogContext) || {}
  
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {children}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// Dialog Title
export const DialogTitle = ({ className = '', children, ...props }) => {
  return (
    <h2 
      className={`text-lg font-semibold text-gray-900 ${className}`} 
      {...props}
    >
      {children}
    </h2>
  )
}

// Dialog Description
export const DialogDescription = ({ className = '', children, ...props }) => {
  return (
    <p 
      className={`mt-1 text-sm text-gray-600 ${className}`} 
      {...props}
    >
      {children}
    </p>
  )
}

// Dialog Body
export const DialogBody = ({ className = '', children, ...props }) => {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

// Dialog Footer
export const DialogFooter = ({ className = '', children, ...props }) => {
  return (
    <div 
      className={`
        px-6 py-4 border-t border-gray-200 
        flex items-center justify-end space-x-2 rtl:space-x-reverse
        ${className}
      `} 
      {...props}
    >
      {children}
    </div>
  )
}

// Export all components as default
export default {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter
}