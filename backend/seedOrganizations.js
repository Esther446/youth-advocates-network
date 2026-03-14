require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('./src/models/Organization');

const seedOrganizations = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Clear existing
        await Organization.deleteMany({});

        const adminId = '69a22398050b4f97a15cc100';
        const organizations = [
            {
                name: 'Care & Help Child Organization',
                description: 'Dedicated to breaking barriers to education, ensuring safety, fostering mental well-being, and empowering young minds.',
                type: 'ngo',
                location: 'Rwanda',
                focusArea: 'Education, mental well-being, child protection',
                impactData: 'Reaching 574 vulnerable children',
                image: 'images/care_help.png',
                status: 'active',
                createdBy: adminId
            },
            {
                name: 'OAZIS Health',
                description: 'Addressing health challenges and building bridges of access, knowledge, and empowerment for marginalized communities.',
                type: 'ngo',
                location: 'Bugesera',
                focusArea: 'Health Equity, Antimicrobial Resistance',
                impactData: 'Trained over 850 healthcare providers',
                image: 'images/oazis_health.png',
                status: 'active',
                createdBy: adminId
            },
            {
                name: 'WHAT IF-Rwanda',
                description: 'Nurturing vulnerable children and painting vibrant futures through the power of mentorship and early childhood development.',
                type: 'ngo',
                location: 'Iramiro Center',
                focusArea: 'Child Mentorship, Early Childhood Development',
                impactData: 'Improved clean water access and consistent school support',
                image: 'images/what_if_rwanda.png',
                status: 'active',
                createdBy: adminId
            }
        ];

        await Organization.insertMany(organizations);
        console.log('✅ Organizations seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding organizations:', error);
        process.exit(1);
    }
};

seedOrganizations();
