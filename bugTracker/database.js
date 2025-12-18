import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from 'dotenv';
dotenv.config();

// Generate/Parse an ObjectIds
const newId = (str) => ObjectId.createFromHexString(str);

// Global variable storing the open connection
let _db;
let _client;

// Connect to database
export async function connectToDatabase() {
    if (!_db) {
        // Check for MONGO_URI first, fallback to DATABASE_URL
        const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
        const dbName = process.env.MONGO_DB_NAME;

        if (!uri || !dbName) {
            throw new Error('❌ Missing MONGO_URI/DATABASE_URL or MONGO_DB_NAME');
        }

        console.log('🔌 Connecting to MongoDB with TLS fallback...');

        _client = new MongoClient(uri, {
            ssl: true,
            tlsAllowInvalidCertificates: true,
            serverSelectionTimeoutMS: 20000,
            retryWrites: true,
            w: 'majority'
        });

        await _client.connect(); 
        _db = _client.db(dbName);
        console.log(`✅ Connected to MongoDB database: ${dbName}`);
    }

    return _db;
}

// Get the MongoDB client (needed for Better Auth)
export async function getClient() {
    if (!_client) {
        await connectToDatabase();
    }
    return _client;
}

// Return the connected DB object for raw collection access
async function getDb() {
    return await connectToDatabase();
}

// Fetch all users from the Users collection
async function getUsers(filter = {}, sort = {}, skip = 0, limit = 0) {
    const db = await connectToDatabase();
    let query = db.collection('user').find(filter).sort(sort);

    if (skip > 0) {
        query = query.skip(skip);
    }

    if (limit > 0) {
        query = query.limit(limit);
    }
    return query.toArray();
}

// Fetch all bugs from the Bugs collection
async function getBugs(filter = {}, sort = {}, skip = 0, limit = 0) {
    const db = await connectToDatabase();
    let query = db.collection('Bugs').find(filter).sort(sort);

    if (skip > 0) {
        query = query.skip(skip);
    }

    if (limit > 0) {
        query = query.limit(limit);
    }
    return query.toArray();
}

export { getUsers, getBugs, getDb, newId };