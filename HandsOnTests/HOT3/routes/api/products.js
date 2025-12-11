import express from 'express';
import { getDb } from '../../database.js';
import { ObjectId } from 'mongodb';
import { productCreateSchema, productIdSchema, productNameSchema, productUpdateSchema } from '../../validation/productSchema.js';
import { validate } from '../../middleware/validator.js';
import { isAuthenticated } from '../../middleware/isAuthenticated.js'; 
import { hasRole } from '../../middleware/hasRole.js';
import { validId } from '../../middleware/validId.js';

const router = express.Router();

// Get all products------------------------------------------------------------------------------------------------------------
router.get('/', async (req, res) => {
  console.log('Fetching all products');
    console.log('Query params:', req.query);
  console.log('Category value:', req.query.category);
  try {
    const db = await getDb();
    const productsCollection = db.collection('products');

    const { keywords, category, maxPrice, minPrice, sortBy, page, pageSize } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 9;
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

    const filter = {};
    
    if (keywords) {
      filter.name = { $regex: keywords, $options: 'i' };
    }

    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    let sort = {};
    if (sortBy === 'lowestPrice') {
      sort = { price: 1, name: 1 };
    } else if (sortBy === 'category') {
      sort = { category: 1, name: 1 };
    } else if (sortBy === 'newest') {
      sort = { createdAt: -1, name: 1 };
    } else if (sortBy === '' || sortBy === 'name') {
      sort = { name: 1 };
    }

    const products = await productsCollection
      .find(filter)
      .project({ _id: 1, name: 1, description: 1, price: 1, category: 1, createdAt: 1, lastUpdated: 1 })
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const totalCount = await productsCollection.countDocuments(filter);

    if (!products || products.length === 0) {
      return res.status(404).json({ error: 'No products found' });
    }

    res.status(200).json({
      products: products.map(product => ({
        _id: product._id?.toString?.() || product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        createdAt: product.createdAt,
        lastUpdated: product.lastUpdated
      })),
      pagination: {
        currentPage: pageNum,
        totalPages: limitNum > 0 ? Math.ceil(totalCount / limitNum) : 1,
        totalItems: totalCount,
        itemsPerPage: limitNum
      }
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});


//get product by id--------------------------------------------------------------------------------------------------------
router.get('/:id', isAuthenticated, validId, hasRole('admin'), async (req, res) => {
  try {
    const db = await getDb();
    const productId = req.params.id;

    const product = await db
      .collection('products')
      .findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({
      _id: product._id?.toString?.() || product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      createdAt: product.createdAt,
      lastUpdated: product.lastUpdated
    });
  } catch (err) {
    console.error('Error fetching product by id:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

//get product by name-------------------------------------------------------------------------------------------------

router.get('/name/:name', isAuthenticated, hasRole('admin'), validate(productNameSchema), async (req, res) => {
  try {
    const db = await getDb();
    const productName = req.params.name;

    const products = await db
      .collection('products')
      .find({ name: { $regex: productName, $options: 'i' } })
      .toArray();

    if (!products || products.length === 0) {
      return res.status(404).json({ error: 'No products found' });
    }

    res.status(200).json(products);

  } catch (err) {
    console.error('Error fetching product by name:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});


// Add new product------------------------------------------------------------------------------------------------
router.post('/create', isAuthenticated, validate(productCreateSchema), hasRole('admin'), async (req, res) => {
  try {
    const db = await getDb();
    const newProduct = req.body;

    // Check if product already exists (case-insensitive)
    const existingProduct = await db.collection('products').findOne(
      { name: { $regex: `^${newProduct.name}$`, $options: 'i' } }
    );

    if (existingProduct) {
      return res.status(409).json({ error: 'Product with same name already exists' });
    }

    const productToAdd = {
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      category: newProduct.category,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    const result = await db.collection('products').insertOne(productToAdd);

    res.status(201).json({
      message: 'Product successfully added',
      productId: result.insertedId
    });

  } catch (err) {
    console.error('Error adding new product:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});



//update a product----------------------------------------------------------------------------------------------------------------
router.patch('/:id/update', isAuthenticated, validate(productIdSchema, 'params'), hasRole('admin'), validate(productUpdateSchema, 'body'), async (req, res) => {
  try{
    const db = await getDb();
    const productId = req.params.id;
    const updates = req.body;
    updates.lastUpdated = new Date();

    if(!ObjectId.isValid(productId)){
      return res.status(400).json({error: 'Invalid product ID' });
    }

    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(productId) },
      { $set: updates }
    );

    if(result.matchedCount === 0){
      return res.status(404).json({error: 'Product not found' });
    }
    res.status(200).json({
      message: 'Product successfully updated',
      lastUpdated: updates.lastUpdated
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({error: err.message || 'Internal server error' 
    })
  }
});;

//delete a product by id------------------------------------------------------------------------------------------------------
router.delete('/:id/delete', validate(productIdSchema), isAuthenticated, hasRole('admin'), async (req, res) => {
  try{
    const db = await getDb();
    const productId = req.params.id;

    if(!ObjectId.isValid(productId)){
      return res.status(400).json({error: 'Invalid product id'});
    }

    const result = await db.collection('products').deleteOne({ _id: new ObjectId(productId) });


    if(result.deletedCount === 0){
      return res.status(404).json({error: 'Product not found'});
    }
    res.status(200).json({message: 'Product successfully deleted',
      deletedId : productId
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({error: err.message || 'Internal server error' });
  }
});

export { router as productsRouter };
