import React, { useState } from 'react'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { Input } from './input'
import { Button } from './button'
import { Label } from './label'
import { Textarea } from './textarea'
import { SubmitButton } from './LoadingButton'

/**
 * مكون حقل محسن مع validation
 */
export const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  icon: Icon,
  helperText,
  rows,
  options, // للـ select
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type
  
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows || 3}
            className={`
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            {...props}
          />
        )
      
      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-50 disabled:text-gray-500
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            {...props}
          >
            <option value="">{placeholder || `اختر ${label}`}</option>
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      default:
        return (
          <div className="relative">
            {Icon && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-gray-400" />
              </div>
            )}
            <Input
              id={name}
              name={name}
              type={inputType}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              className={`
                ${Icon ? 'pl-10' : ''}
                ${isPassword ? 'pr-10' : ''}
                ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                ${className}
              `}
              {...props}
            />
            {isPassword && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            )}
          </div>
        )
    }
  }

  return (
    <div className="space-y-1">
      {label && (
        <Label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </Label>
      )}
      
      {renderInput()}
      
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}

/**
 * مكون نموذج محسن مع validation شامل
 */
export const EnhancedForm = ({
  onSubmit,
  children,
  loading = false,
  submitText = 'حفظ',
  cancelText = 'إلغاء',
  onCancel,
  className = '',
  showButtons = true,
  successMessage,
  ...props
}) => {
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (onSubmit) {
      await onSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`} {...props}>
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span>{successMessage}</span>
        </div>
      )}
      
      {children}
      
      {showButtons && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
          )}
          <SubmitButton loading={loading}>
            {submitText}
          </SubmitButton>
        </div>
      )}
    </form>
  )
}

/**
 * Hook للتعامل مع validation النماذج
 */
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const setValue = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const setFieldTouched = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }

  const validateField = (name, value) => {
    const rules = validationRules[name]
    if (!rules) return null

    for (const rule of rules) {
      const error = rule(value, values)
      if (error) return error
    }
    return null
  }

  const validateAll = () => {
    const newErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, values[field])
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {}))

    return isValid
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateField,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  }
}

/**
 * قواعد validation شائعة
 */
export const validationRules = {
  required: (message = 'هذا الحقل مطلوب') => (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message
    }
    return null
  },

  email: (message = 'البريد الإلكتروني غير صحيح') => (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message
    }
    return null
  },

  minLength: (min, message) => (value) => {
    if (value && value.length < min) {
      return message || `يجب أن يكون على الأقل ${min} أحرف`
    }
    return null
  },

  phone: (message = 'رقم الهاتف غير صحيح') => (value) => {
    if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
      return message
    }
    return null
  },

  match: (otherField, message) => (value, allValues) => {
    if (value && allValues[otherField] && value !== allValues[otherField]) {
      return message || 'القيم غير متطابقة'
    }
    return null
  }
}

export default EnhancedForm

