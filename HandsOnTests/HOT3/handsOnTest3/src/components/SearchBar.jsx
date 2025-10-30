"use client"

import { useState } from "react"
import "./SearchBar.css"

function SearchBar({ onSearch, onReset }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("name")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim(), searchType)
    }
  }

  const handleReset = () => {
    setSearchTerm("")
    onReset()
  }

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="search-type">
          <option value="name">Search by Name</option>
          <option value="id">Search by ID</option>
        </select>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Enter product ${searchType}...`}
          className="search-input"
        />

        <button type="submit" className="btn btn-search">
          Search
        </button>

        <button type="button" className="btn btn-reset" onClick={handleReset}>
          Show All
        </button>
      </form>
    </div>
  )
}

export default SearchBar
