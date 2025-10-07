import { useState, useEffect } from 'react'
import { useApi } from './useApi'

const useSales = () => {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  const fetchSales = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.getSales()
      setSales(response.data || [])
    } catch (err) {
      console.error('Error fetching sales:', err)
      setError(err.message || 'Failed to fetch sales')
      setSales([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [])

  const refetch = () => {
    fetchSales()
  }

  const addSale = async (saleData) => {
    try {
      const response = await api.addSale(saleData)
      await fetchSales() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const updateSale = async (id, saleData) => {
    try {
      const response = await api.updateSale(id, saleData)
      await fetchSales() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const deleteSale = async (id) => {
    try {
      const response = await api.deleteSale(id)
      await fetchSales() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  return {
    sales,
    loading,
    error,
    refetch,
    addSale,
    updateSale,
    deleteSale
  }
}

export { useSales }
export default useSales