import type { SearchFilters } from '@/components/SearchBar'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2023/api/products"

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

const handleResponse = async (response: Response) => {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong")
  }

  return data
}

export const getAllProducts = async (filters?: SearchFilters) => {
  let url = API_BASE_URL

  if (filters) {
    const params = new URLSearchParams()
    
    if (filters.keywords) params.append('keywords', filters.keywords)
    if (filters.category) params.append('category', filters.category)
    if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString())
    if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString())
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.order) params.append('order', filters.order)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const response = await fetch(url, {
    credentials: 'include',
    headers: getAuthHeaders()
  })
  
  const data = await handleResponse(response)
  
  return {
    products: data.products || [],
    pagination: data.pagination || null
  }
}

export const getProductById = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    credentials: 'include',
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const getProductByName = async (name: string) => {
  const response = await fetch(`${API_BASE_URL}/name/${encodeURIComponent(name)}`, {
    credentials: 'include',
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const createProduct = async (productData: any) => {
  const response = await fetch(`${API_BASE_URL}/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(productData)
  })
  return handleResponse(response)
}

export const updateProduct = async (id: string, productData: any) => {
  const response = await fetch(`${API_BASE_URL}/${id}/update`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(productData)
  })
  return handleResponse(response)
}

export const deleteProduct = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/${id}/delete`, {
    method: "DELETE",
    credentials: 'include',
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}