require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB connection...');
console.log('📝 MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'NOT FOUND');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env file');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Connection details:');
    console.log('  - Host:', mongoose.connection.host);
    console.log('  - Database:', mongoose.connection.name);
    console.log('  - Ready state:', mongoose.connection.readyState);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
    process.exit(1);
  });

// Timeout after 10 seconds
setTimeout(() => {
  console.error('⏱️  Connection timeout after 10 seconds');
  process.exit(1);
}, 10000);
