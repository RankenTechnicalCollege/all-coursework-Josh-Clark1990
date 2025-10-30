# Product Inventory Management - Frontend

A Next.js frontend for managing product inventory with full CRUD operations.

## Features

- Display all products in a grid layout
- Search products by name or ID
- Add new products
- Update existing products
- Delete products
- Responsive design

## Prerequisites

- Node.js (v18 or higher)
- Backend API running (default: `http://localhost:5000`)

## Installation

This project is built with Next.js and is ready to run in the v0 environment.

## API Configuration

The frontend connects to your backend API using the `NEXT_PUBLIC_API_URL` environment variable.

**To configure your backend URL:**

1. Click on the **Vars** section in the in-chat sidebar
2. Add a new environment variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** Your backend URL (e.g., `http://localhost:5000/api/products`)

If not set, it defaults to `http://localhost:5000/api/products`.

## Backend Routes Expected

The frontend expects these routes from your Express backend:

- `GET /` - Get all products
- `GET /:id` - Get product by ID
- `GET /name/:name` - Get product by name
- `POST /create` - Create new product
- `PATCH /:id/update` - Update product
- `DELETE /:id/delete` - Delete product

## CORS Configuration

Make sure your Express backend has CORS enabled to allow requests from the frontend:

\`\`\`javascript
import cors from 'cors';
app.use(cors());
\`\`\`
