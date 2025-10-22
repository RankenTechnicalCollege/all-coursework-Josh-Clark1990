import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from 'dotenv';
dotenv.config();

// Generate/Parse an ObjectIds
const newId = (str) => ObjectId.createFromHexString(str);

// Global variable storing the open connection, do not use it directly
let _db;

console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("Using connection string:", process.env.MONGO_URI || process.env.MONGODB_URI);

// Connect to database
export async function connectToDatabase() {
    if (!_db) {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        const dbName = process.env.MONGO_DB_NAME;

        if (!uri || !dbName) {
            throw new Error('❌ Missing MONGO_URI/MONGODB_URI or MONGO_DB_NAME');
        }

        console.log('🔌 Connecting to MongoDB with TLS fallback...');

        const client = await MongoClient.connect(uri, {
            ssl: true,
            tlsAllowInvalidCertificates: true,
            serverSelectionTimeoutMS: 20000,
            retryWrites: true,
            w: 'majority'
        });

        _db = client.db(dbName);
        console.log(`✅ Connected to MongoDB database: ${dbName}`);
    }

    return _db;
}



// Fetch all users from the Users collection
async function getUsers() {
    const db = await connectToDatabase();
    let query = db.collection('Users').find(filter).sort(sort);

    if (skip > 0){
        query = query.skip(skip);
    }

    if (limit > 0){
        query = query.limit(limit);
    }
    return query.toArray();
}

// Fetch all bugs from the Bugs collection
async function getBugs() {
    const db = await connectToDatabase();
    let query = db.collection('Bugs').find(filter).sort(sort);

    if (skip > 0){
        query = query.skip(skip);
    }

    if (limit > 0){
        query = query.limit(limit);
    }
    return query.toArray();
}

// Return the connected DB object for raw collection access
async function getDb() {
    return await connectToDatabase();
}

export { getUsers, getBugs, getDb, newId };
