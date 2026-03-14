require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const User = require('./src/models/User');
const Course = require('./src/models/Course');
const Lesson = require('./src/models/Lesson');

seedLms();

async function seedLms() {
    await connectDB();

    try {
        console.log('Seeding LMS Test Data...');

        // 1. Get or create a creator user
        let admin = await User.findOne({ email: 'admin_lms_test@example.com' });
        if (!admin) {
            admin = await User.create({
                name: 'LMS Admin',
                email: 'admin_lms_test@example.com',
                password: 'password123',
                role: 'admin'
            });
        }

        // 2. Clear old test courses to prevent duplicates
        await Course.deleteMany({ title: 'Introduction to Youth Leadership' });

        // 3. Create a test Course
        const course = await Course.create({
            title: 'Introduction to Youth Leadership',
            description: 'A comprehensive onboarding module for new YAN members covering the basics of leadership, organizing, and community development.',
            status: 'published',
            difficulty: 'beginner',
            duration: '2 Weeks',
            quarter: 'Q1',
            createdBy: admin._id
        });

        // 4. Create Lessons for the Course
        const lesson1 = await Lesson.create({
            course: course._id,
            title: 'What is Youth Leadership?',
            content: '<p>Youth leadership is the practice of teens exercising authority over themselves or others.</p>',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        });

        const lesson2 = await Lesson.create({
            course: course._id,
            title: 'Community Organizing 101',
            content: '<p>Learn how to map power in your community and organize effective campaigns.</p>',
            order: 2,
            resourceLinks: ['https://example.com/organizing-guide.pdf']
        });

        const lesson3 = await Lesson.create({
            course: course._id,
            title: 'Project Management Basics',
            content: '<p>Understanding goals, timelines, and deliverables for your initiatives.</p>',
            order: 3
        });

        console.log('LMS Data seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}
