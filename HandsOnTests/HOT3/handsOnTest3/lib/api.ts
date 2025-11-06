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

export const getAllProducts = async () => {
  const response = await fetch(API_BASE_URL, {
    credentials: 'include',
    headers: getAuthHeaders()
  })
  const data = await handleResponse(response)
  return data.products || []
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