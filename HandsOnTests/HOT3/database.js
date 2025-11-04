import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const newId = (str) => ObjectId.createFromHexString(str);

let _db;

export async function connectToDatabase() {
  if (!_db) {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    const dbName = process.env.MONGO_DB_NAME;

    if (!uri || !dbName) {
      throw new Error('Missing MONGO_URI or MONGO_DB_NAME');
    }

    console.log('Connecting to database...');

    const client = await MongoClient.connect(uri, {
      ssl: true,
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 20000,
      retryWrites: true,
      w: 'majority',
    });

    _db = client.db(dbName);
  }

  return _db;
}

export async function getDb() {
  return await connectToDatabase();
}

export async function getProducts(filter = {}, sort = {}, skip = 0, limit = 0) {
  const db = await connectToDatabase();
  let query = db.collection('products').find(filter).sort(sort);

  if (skip > 0) query = query.skip(skip);
  if (limit > 0) query = query.limit(limit);

  return query.toArray();
}

export { newId };

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
export const client = new MongoClient(uri, {
  ssl: true,
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 20000,
  retryWrites: true,
  w: 'majority',
});
