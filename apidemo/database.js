import { MongoClient} from "mongodb";
import debug from "debug";
const debugDb = debug("app:Database");

// Cached database connection
let _db = null;

// Connect to MongoDB
async function connectToDatabase() {
  if (!_db) {
    
    const rawConnectionString = process.env.MONGO_URI || process.env.MONGODB_URI;
    const connectionString = rawConnectionString ? rawConnectionString.trim() : rawConnectionString;
    const dbName = process.env.MONGO_DB_NAME;

    if (!connectionString || !dbName) {
      throw new Error('Missing database environment variables. Provide MONGO_URI or MONGODB_URI and MONGO_DB_NAME');
    }

    const client = await MongoClient.connect(connectionString);
    _db = client.db(dbName);
  }
  return _db;
}

// Ping the database to ensure connection is established
async function ping() {
  const db = await connectToDatabase();
  const pong = await db.command({ping:1});
  debugDb(`Ping:, ${JSON.stringify(pong)}`);
}

// Fetch all users from the Users collection
async function getUsers() {
  const db = await connectToDatabase();
  return db.collection('Users').find({}).toArray();
}

// Fetch all bugs from the Bugs collection
async function getBugs() {
  const db = await connectToDatabase();
  return db.collection('Bugs').find({}).toArray();
}

// Return the connected DB object for raw collection access
async function getDb() {
  return await connectToDatabase();
}

export {ping,getUsers,getBugs,getDb} 