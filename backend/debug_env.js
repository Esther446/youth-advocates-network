require('dotenv').config();

console.log('--- ENV CHECK ---');
console.log('CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing');
console.log('API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing');
console.log('-----------------');
