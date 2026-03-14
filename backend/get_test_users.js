
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://yan_admin:Pandora3%40@cluster0.ge5cyd3.mongodb.net/?appName=Cluster0';

async function getUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'name email role').lean();
        
        console.log('\n--- TEST USER CREDENTIALS ---');
        console.log(JSON.stringify(users, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

getUsers();
