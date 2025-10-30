"use client"

import { useState, useEffect } from "react"
import ProductList from "./components/ProductList"
import ProductForm from "./components/ProductForm"
import SearchBar from "./components/SearchBar"
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProductByName,
} from "./services/api"
import "./App.css"

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [searchMode, setSearchMode] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

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

export default App
