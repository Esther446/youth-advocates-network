const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    
    if (!dbUri) {
      console.error('❌ CRITICAL ERROR: MONGODB_URI environment variable is not defined!');
      console.log('Current process.env keys:', Object.keys(process.env).filter(k => k.includes('MONGO')));
      process.exit(1);
    }

    const conn = await mongoose.connect(dbUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
