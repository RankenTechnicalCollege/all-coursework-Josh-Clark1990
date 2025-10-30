"use client"

import "@/styles/product-card.css"

interface Product {
  _id: string
  name: string
  description: string
  price: number
  category: string
  createdAt?: string
  lastUpdated?: string
}

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="product-card">
      <div className="product-header">
        <h3>{product.name}</h3>
        <span className="product-category">{product.category}</span>
      </div>

      <div className="product-body">
        <p className="product-description">{product.description}</p>
        <p className="product-price">${Number(product.price).toFixed(2)}</p>
        <p className="product-id">ID: {product._id}</p>
        {product.lastUpdated && <p className="product-date">Updated: {formatDate(product.lastUpdated)}</p>}
      </div>

      <div className="product-actions">
        <button className="btn btn-edit" onClick={() => onEdit(product)}>
          Edit
        </button>
        <button className="btn btn-delete" onClick={() => onDelete(product._id)}>
          Delete
        </button>
      </div>
    </div>
  )
}
