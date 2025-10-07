/**
 * مكون اختيار العميل - Client Selector Component
 * يسمح للمستخدم باختيار عميل من قائمة منسدلة مع إمكانية البحث
 */

import React, { useState, useEffect, useRef } from 'react'
import { 
  User, 
  Users, 
  Search, 
  Phone, 
  MapPin,
  ChevronDown, 
  X 
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useApi } from '../../hooks/useApi'

const ClientSelector = ({ selectedClient, onSelect, placeholder = "اختر عميل أو عميل محتمل..." }) => {
  const { currentUser } = useAuth()
  const { getClients, getLeads } = useApi()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  // Filter clients and leads based on search term
  const filteredClients = clients.filter(item =>
    item.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone?.includes(searchTerm) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.typeLabel?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Fetch clients and leads from API
  const fetchClients = async () => {
    setLoading(true)
    try {
      // Fetch both clients and leads in parallel
      const [clientsResponse, leadsResponse] = await Promise.all([
        getClients(),
        getLeads()
      ])
      
      const allItems = []
      
      // Add clients with type indicator
      if (clientsResponse && clientsResponse.data) {
        const clientsWithType = clientsResponse.data.map(client => ({
          ...client,
          itemType: 'client',
          displayName: client.name,
          company: client.company || '',
          typeLabel: 'عميل'
        }))
        allItems.push(...clientsWithType)
      }
      
      // Add leads with type indicator
      if (leadsResponse && leadsResponse.data) {
        const leadsWithType = leadsResponse.data.map(lead => ({
          ...lead,
          itemType: 'lead',
          displayName: lead.name,
          company: lead.company || '',
          typeLabel: 'عميل محتمل'
        }))
        allItems.push(...leadsWithType)
      }
      
      // Sort by name
      allItems.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ar'))
      
      setClients(allItems)
    } catch (error) {
      console.error('❌ ClientSelector: Error fetching clients and leads:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  // Handle client selection
  const handleSelect = (client) => {
    onSelect(client)
    setIsOpen(false)
    setSearchTerm('')
  }

  // Clear selection
  const handleClear = (e) => {
    e.stopPropagation()
    onSelect(null)
  }

  // Handle open dropdown
  const handleOpen = () => {
    setIsOpen(true)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load clients when component mounts
  useEffect(() => {
    fetchClients()
  }, [])

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Users className="inline w-4 h-4 mr-2" />
        العميل / العميل المحتمل
      </label>
      
      {/* Selected Client Display */}
      <div
        className={`
          w-full px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200
          ${isOpen 
            ? 'border-blue-500 ring-2 ring-blue-200' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${selectedClient ? 'bg-blue-50' : 'bg-white'}
        `}
        onClick={handleOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {selectedClient ? (
              <>
                <div className={`p-2 rounded-lg ${selectedClient.itemType === 'lead' ? 'bg-green-100' : 'bg-blue-100'}`}>
                  {selectedClient.itemType === 'lead' ? (
                    <Users className="h-4 w-4 text-green-600" />
                  ) : (
                    <User className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {selectedClient.displayName || selectedClient.name}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedClient.itemType === 'lead' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedClient.typeLabel}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-4">
                    {selectedClient.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedClient.phone}
                      </span>
                    )}
                    {selectedClient.company && (
                      <span className="truncate">{selectedClient.company}</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Users className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-gray-500">{placeholder}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {selectedClient && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="ابحث عن عميل أو عميل محتمل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Client List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                جاري التحميل...
              </div>
            ) : filteredClients.length > 0 ? (
              <div className="py-2">
                {filteredClients.map(item => (
                  <div
                    key={`${item.itemType}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.itemType === 'lead' ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {item.itemType === 'lead' ? (
                          <Users className="h-4 w-4 text-green-600" />
                        ) : (
                          <User className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {item.displayName}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.itemType === 'lead' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {item.typeLabel}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                          {item.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {item.phone}
                            </span>
                          )}
                          {item.company && (
                            <span className="truncate">{item.company}</span>
                          )}
                          {item.address && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3" />
                              {item.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? (
                  <>
                    <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <div>لا توجد نتائج للبحث "{searchTerm}"</div>
                  </>
                ) : (
                  <>
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <div>لا توجد عملاء أو عملاء محتملين</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientSelector