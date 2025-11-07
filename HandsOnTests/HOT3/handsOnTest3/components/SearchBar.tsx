"use client"

import type React from "react"

import { useState } from "react"
import "@/styles/search-bar.css"

export interface SearchFilters {
  keywords?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'name' | 'price' | 'category' | 'createdAt'
  order?: 'asc' | 'desc'
  page: number
  limit: number
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void
  onReset: () => void
  currentPage?: number
  totalPages?: number
}

export default function SearchBar({ onSearch, onReset, currentPage = 1, totalPages = 1 }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState<"keywords" | "category">("keywords")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category' | 'createdAt'>('category')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(1) // Reset to page 1 on new search
  }

  const handleSearch = (newPage: number = page) => {
    setPage(newPage)
    
    const filters: SearchFilters = {
      page: newPage,
      limit: 10,
      sortBy,
      order
    }

    if (searchType === "keywords" && searchTerm.trim()) {
      filters.keywords = searchTerm.trim()
    }

    if (searchType === "category" && searchTerm.trim()) {
      filters.category = searchTerm.trim()
    }

    if (minPrice) {
      filters.minPrice = parseFloat(minPrice)
    }

    if (maxPrice) {
      filters.maxPrice = parseFloat(maxPrice)
    }

    onSearch(filters)
  }

  const handleReset = () => {
    setSearchTerm("")
    setMinPrice("")
    setMaxPrice("")
    setSortBy('category')
    setOrder('asc')
    setPage(1)
    onReset()
  }

  const toggleSortOrder = () => {
    setOrder(order === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <select 
          value={searchType} 
          onChange={(e) => setSearchType(e.target.value as "keywords" | "category")} 
          className="search-type"
        >
          <option value="keywords">Search by Keywords</option>
          <option value="category">Search by Category</option>
        </select>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Enter ${searchType}...`}
          className="search-input"
        />

        <button type="submit" className="btn btn-search">
          Search
        </button>

        <button type="button" className="btn btn-reset" onClick={handleReset}>
          Show All
        </button>
      </form>

      {/* Additional Filters Row */}
      <div className="filters-row">
        <div className="filter-group">
          <label>Price Range:</label>
          <div className="price-inputs">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min"
              className="price-input"
              min="0"
              step="0.01"
            />
            <span>-</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max"
              className="price-input"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <div className="sort-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="category">Category</option>
              <option value="createdAt">Date</option>
            </select>
            <button
              type="button"
              onClick={toggleSortOrder}
              className="btn btn-sort-order"
              title={order === 'asc' ? 'Ascending' : 'Descending'}
            >
              {order === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        <button type="button" onClick={() => handleSearch(page)} className="btn btn-apply">
          Apply Filters
        </button>
      </div>

      {/* Pagination */}
      {(currentPage > 1 || totalPages > 1) && (
        <div className="pagination">
          <button
            type="button"
            onClick={() => handleSearch(page - 1)}
            disabled={page === 1}
            className="btn btn-page"
          >
            ← Previous
          </button>
          <span className="page-info">Page {currentPage} of {totalPages}</span>
          <button
            type="button"
            onClick={() => handleSearch(page + 1)}
            disabled={page >= totalPages}
            className="btn btn-page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}