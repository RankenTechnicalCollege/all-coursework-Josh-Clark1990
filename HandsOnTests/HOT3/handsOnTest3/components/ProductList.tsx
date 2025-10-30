import ProductCard from "./ProductCard"
import "@/styles/product-list.css"

interface Product {
  _id: string
  name: string
  description: string
  price: number
  category: string
  createdAt?: string
  lastUpdated?: string
}

interface ProductListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  searchMode: boolean
}

export default function ProductList({ products, onEdit, onDelete, searchMode }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <p>
          {searchMode ? "No products found matching your search." : "No products available. Add your first product!"}
        </p>
      </div>
    )
  }

  return (
    <div className="product-list">
      <h2>Products ({products.length})</h2>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
