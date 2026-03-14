require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Event = require('./src/models/Event');

const seedEvents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Clear existing
        await Event.deleteMany({});

        const adminId = '69a22398050b4f97a15cc100';
        const events = [
            {
                title: 'World Antimicrobial Awareness Week',
                description: 'Workshops, campaigns, and awareness radio and TV shows engaging over 500,000 people.',
                type: 'workshop',
                date: '2026-11-18',
                time: '10:00 AM',
                location: 'Rwanda (Nationwide)',
                status: 'active',
                createdBy: adminId
            },
            {
                title: 'Transgenerational Trauma Conference',
                description: 'Conferences raising awareness about trauma transmission and providing guidance on effective coping strategies.',
                type: 'summit',
                date: '2026-05-10',
                time: '09:00 AM',
                location: 'Kigali, Rwanda',
                status: 'active',
                createdBy: adminId
            },
            {
                title: 'Youth Environment & Climate Action Summit',
                description: 'National gathering focused on climate resilience and youth-led environmental initiatives.',
                type: 'summit',
                date: '2026-09-22',
                time: '08:30 AM',
                location: 'Intare Arena, Kigali',
                status: 'active',
                createdBy: adminId
            },
            {
                title: 'Healthcare Innovation Boot Camp',
                description: 'Intensive training for young healthcare professionals on digital health solutions.',
                type: 'training',
                date: '2026-07-15',
                time: '09:00 AM',
                location: 'Norrsken House, Kigali',
                status: 'active',
                createdBy: adminId
            }
        ];

        await Event.insertMany(events);
        console.log('✅ Events seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding events:', error);
        process.exit(1);
    }
};

seedEvents();
