import React from 'react'
import { cn } from '../../lib/utils'

export function Toggle({ 
  checked = false, 
  onChange, 
  disabled = false, 
  size = 'md',
  color = 'green',
  className = '',
  ...props 
}) {
  return (
    <div className="inline-flex items-center">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange?.(!checked)}
        disabled={disabled}
        className={cn(
          'toggle-switch',
          checked ? 'toggle-on' : 'toggle-off',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        style={{
          width: '44px',
          height: '24px',
          backgroundColor: checked ? '#16a34a' : '#d1d5db',
          borderRadius: '12px',
          position: 'relative',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s ease',
          padding: '2px'
        }}
        {...props}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: 'white',
            borderRadius: '50%',
            position: 'absolute',
            top: '2px',
            left: checked ? '22px' : '2px',
            transition: 'left 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
        <span className="sr-only">{checked ? 'مفعل' : 'معطل'}</span>
      </button>
    </div>
  )
}
