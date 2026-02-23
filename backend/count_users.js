require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const countUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const count = await User.countDocuments();
        console.log(`Total Users: ${count}`);

        if (count > 0) {
            const users = await User.find({}, 'name email role');
            console.log('--- User Details ---');
            users.forEach(u => {
                console.log(`${u.role.toUpperCase()}: ${u.name} (${u.email})`);
            });
        }

        process.exit();
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

countUsers();
