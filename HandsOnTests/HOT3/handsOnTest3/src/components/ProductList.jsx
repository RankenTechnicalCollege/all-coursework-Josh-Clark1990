import ProductCard from "./ProductCard"
import "./ProductList.css"

function ProductList({ products, onEdit, onDelete, searchMode }) {
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

export default ProductList
