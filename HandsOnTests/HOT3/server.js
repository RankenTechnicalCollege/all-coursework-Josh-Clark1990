import express from 'express';
import debug from 'debug';
import productsRouter from './routes/api/products.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
2
app.use('/api/products', productsRouter);

const PORT = process.env.PORT || 2023;
const HOST = 'localhost';

app.listen(PORT, '0.0.0.0', () => {
  debug(`Server is running at http://${HOST}:${PORT}`);
  console.log(`Server is running at http://${HOST}:${PORT}`);

});

