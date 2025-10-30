import { getDb } from './database.js';

async function findUser() {
  try {
    const db = await getDb();
    const userId = 'UOb2I5zXwHn806dEuzBxm3m4kRvloynl'; // ⚠️ REPLACE THIS with your actual user ID from the error
    
    console.log('Searching for user:', userId);
    console.log('\n1. Checking User collection (capital U):');
    const userCapital = await db.collection('User').findOne({ id: userId });
    console.log('Found:', userCapital ? 'YES' : 'NO');
    if (userCapital) console.log('User:', userCapital);
    
    console.log('\n2. Checking user collection (lowercase u):');
    const userLower = await db.collection('user').findOne({ id: userId });
    console.log('Found:', userLower ? 'YES' : 'NO');
    if (userLower) console.log('User:', userLower);
    
    console.log('\n3. Checking with _id field:');
    const userById = await db.collection('User').findOne({ _id: userId });
    console.log('Found:', userById ? 'YES' : 'NO');
    if (userById) console.log('User:', userById);
    
    console.log('\n4. Finding ANY user to see structure:');
    const anyUser = await db.collection('User').findOne({});
    if (anyUser) {
      console.log('Sample user fields:', Object.keys(anyUser));
      console.log('Sample user id field:', anyUser.id);
      console.log('Sample user _id field:', anyUser._id);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findUser();