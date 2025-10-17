import express from 'express';
import { getDb } from '../../database.js';
import { ObjectId } from 'mongodb';
import { productCreateSchema, productIdSchemea, productNameSchema } from '../../validation/productSchema.js';
import { validate } from '../../middleware/validator.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  console.log('Fetching all products');
  try {
    const db = await getDb();
    const productsCollection = db.collection('products');

    const products = await productsCollection.find({}).toArray();

    if (!products || products.length === 0) {
      return res.status(404).json({ error: 'No products found' });
    }

    res.status(200).json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});


//get product by id
router.get('/:id', validate(productIdSchemea), async (req, res) => {
  try {
    const db = await getDb();
    const productId = req.params.id;

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await db
      .collection('products')
      .findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (err) {
    console.error('Error fetching product by id:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

//search product by name
router.get('/name/:name', validate(productNameSchema), async (req, res) => {
  try{
    const db = await getDb();
    const productName = req.params.name;

    if(!ObjectId.isValid(productName)){
      return res.status(400).json({error: 'Invalid product name' });
    }

    const product = await db
    .collection('products')
    .findOne({ name: productName });

    if(!product){
      return res.status(404).json({error: 'Product not found'});
    }
    res.status(200).json(product);
    } catch (err) {
      console.error('Error fetching product by name:', err);
      res.status(500).json({error: err.message || 'Internal server error' });
    }
});

//add new product
router.post('/create', validate(productCreateSchema), async (req, res) => {
  try{
    const db = await getDb();
    const newProduct = req.body;

    const existingProduct = await db.collection('products').findOne({name: newProduct.name});
    if(existingProduct){
      return res.status(409).json({error: 'Product with same name already exists'});
    }

    const productToAdd = {
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      category: newProduct.category,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    delete productToAdd. _id;
    
    const result = await db.collection('products').insertOne(productToAdd);
    res.status(201).json({message: 'Product successfully added', productId: result.insertedId});
  } catch (err) {
    console.error('Error adding new product:', err);
    res.status(500).json({error: err.message || 'Internal server error' });
  }
});


//update a product
router.patch('/:id/update', validate(productIdSchemea), async (req, res) => {
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

//delete a product by id
router.delete('/:id/delete', validate(productIdSchemea), async (req, res) => {
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

export default router;
