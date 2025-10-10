import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from 'dotenv';
dotenv.config();

// Generate/Parse an ObjectIds
const newId = (str) => ObjectId.createFromHexString(str);

// Global variable storing the open connection, do not use it directly
let _db = null;

// Connect to database
async function connectToDatabase() {
    if (!_db) {
        const rawConnectionString = process.env.MONGO_URI || process.env.MONGODB_URI;
        const connectionString = rawConnectionString ? rawConnectionString.trim() : rawConnectionString;
        const dbName = process.env.MONGO_DB_NAME;

        if (!connectionString || !dbName) {
            throw new Error(
                'Missing database environment variables. Provide MONGO_URI or MONGODB_URI and MONGO_DB_NAME'
            );
        }

        const client = await MongoClient.connect(connectionString);
        _db = client.db(dbName);
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
