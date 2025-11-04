"use client"

import { useState, useEffect } from "react"
import ProductList from "@/components/ProductList"
import ProductForm from "@/components/ProductForm"
import SearchBar from "@/components/SearchBar"
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProductByName,
} from "@/lib/api"
import "@/styles/app.css"

export default function Page() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  
  // Auth state
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    fetchProducts()
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:2023/api/auth/session', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (err) {
      console.log('Not authenticated')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    
    try {
      const response = await fetch('http://localhost:2023/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setShowAuth(false)
        setEmail('')
        setPassword('')
      } else {
        setAuthError('Invalid credentials')
      }
    } catch (err) {
      setAuthError('Login failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match')
      setAuthLoading(false)
      return
    }
    
    try {
      const response = await fetch('http://localhost:2023/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setShowAuth(false)
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setName('')
      } else {
        const errorData = await response.json()
        setAuthError(errorData.message || 'Registration failed')
      }
    } catch (err) {
      setAuthError('Registration failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:2023/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include'
      })
      setUser(null)
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

  const toggleAuthMode = () => {
    setIsRegister(!isRegister)
    setAuthError('')
    setConfirmPassword('')
  }

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    setSearchMode(false)
    try {
      const data = await getAllProducts()
      setProducts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (searchTerm, searchType) => {
    setLoading(true)
    setError(null)
    try {
      let data
      if (searchType === "id") {
        data = await getProductById(searchTerm)
        setProducts([data])
      } else {
        data = await getProductByName(searchTerm)
        setProducts([data])
      }
      setSearchMode(true)
    } catch (err) {
      setError(err.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (productData) => {
    setLoading(true)
    setError(null)
    try {
      await createProduct(productData)
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleUpdate = async (id, productData) => {
    setLoading(true)
    setError(null)
    try {
      await updateProduct(id, productData)
      setEditingProduct(null)
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      await deleteProduct(id)
      fetchProducts()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Product Inventory Management</h1>
        
        {/* Auth Section */}
        <div style={{ marginTop: '1rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
              <span>Welcome, {user.name || user.email}</span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {!showAuth ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary" onClick={() => { setShowAuth(true); setIsRegister(false); }}>
                    Login
                  </button>
                  <button className="btn btn-primary" onClick={() => { setShowAuth(true); setIsRegister(true); }}>
                    Register
                  </button>
                </div>
              ) : (
                <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {isRegister && (
                    <input
                      type="text"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  )}
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  {isRegister && (
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  )}
                  <button type="submit" className="btn btn-primary" disabled={authLoading}>
                    {authLoading ? 'Loading...' : (isRegister ? 'Register' : 'Sign In')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAuth(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn" onClick={toggleAuthMode} style={{ textDecoration: 'underline' }}>
                    {isRegister ? 'Already have an account?' : 'Need an account?'}
                  </button>
                  {authError && <span style={{ color: 'red', fontSize: '0.9rem', width: '100%' }}>{authError}</span>}
                </form>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="controls">
          <SearchBar onSearch={handleSearch} onReset={fetchProducts} />
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add New Product"}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {showForm && (
          <ProductForm
            product={editingProduct}
            onSubmit={editingProduct ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
          />
        )}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <ProductList products={products} onEdit={handleEdit} onDelete={handleDelete} searchMode={searchMode} />
        )}
      </main>
    </div>
  )
}