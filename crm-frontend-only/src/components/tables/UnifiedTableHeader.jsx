import React from 'react'

export default function UnifiedTableHeader({ columns, onSelectAll, selectedCount, totalCount }) {
  return (
    <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
      <tr>
        {/* Checkbox column */}
        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
          <div className="flex items-center justify-center">
            <input 
              type="checkbox" 
              className="rounded border-purple-300"
              onChange={onSelectAll}
              checked={selectedCount === totalCount && totalCount > 0}
              indeterminate={selectedCount > 0 && selectedCount < totalCount}
            />
          </div>
        </th>
        
        {/* Dynamic columns */}
        {columns.map((column, index) => (
          <th 
            key={index}
            className={`px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${column.minWidth || 'min-w-[120px]'}`}
          >
            <div className="flex items-center gap-2">
              {column.icon && (
                <column.icon className={`h-4 w-4 ${column.iconColor || 'text-purple-600'}`} />
              )}
              <span>{column.label}</span>
            </div>
          </th>
        ))}
      </tr>
    </thead>
  )
}

