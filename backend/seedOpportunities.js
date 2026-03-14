require('dotenv').config();
const mongoose = require('mongoose');
const Opportunity = require('./src/models/Opportunity');

const seedOpportunities = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Clear existing
        await Opportunity.deleteMany({});

        const adminId = '69a22398050b4f97a15cc100';
        const opportunities = [
            {
                title: 'Youth Innovation Grant 2026',
                description: 'A funding opportunity for youth-led organizations working on sustainable development goals in Rwanda, supported by UNICEF.',
                type: 'funding',
                provider: 'UNICEF Rwanda',
                location: 'Kigali / Nationwide',
                link: 'https://www.unicef.org/rwanda/',
                deadline: '2026-06-30',
                status: 'active',
                createdBy: adminId
            },
            {
                title: 'Youth Leadership Bootcamp 2026',
                description: 'Foundational training in leadership, soft skills, and self-management for young advocates (Q1 2026).',
                type: 'training',
                provider: 'YAN Hub',
                location: 'Kigali',
                link: '#',
                deadline: '2026-03-31',
                status: 'active',
                createdBy: adminId
            },
            {
                title: 'Project Design & Management Training',
                description: 'Intensive workshop on Theory of Change, logical frameworks, and stakeholder mapping (Q2 2026).',
                type: 'training',
                provider: 'Youth Advocates Network',
                location: 'Kigali',
                line: '#',
                deadline: '2026-06-15',
                status: 'active',
                createdBy: adminId
            },
            {
                title: 'Grant Writing & Partnership Workshop',
                description: 'Learn to map potential partners and draft winning grant proposals for youth-led initiatives (Q3 2026).',
                type: 'training',
                provider: 'SIC Group / YAN',
                location: 'Kigali / Online',
                line: '#',
                deadline: '2026-09-15',
                status: 'active',
                createdBy: adminId
            },
            {
                title: 'National Inter-University Debate Competition',
                description: 'A platform for youth to voice concerns on Gender Justice, SRHR, and Climate Change through intellectual rivalry.',
                type: 'partnership',
                provider: 'Aspire Debate Rwanda',
                location: 'Kigali',
                link: 'https://aspiredebate.rw',
                deadline: '2026-11-20',
                status: 'active',
                createdBy: adminId
            },
            {
                title: 'Community Mentorship Program',
                description: 'Nurturing vulnerable children through aunties and uncles mentorship. Become a source of their smile.',
                type: 'partnership',
                provider: 'WHAT IF-Rwanda',
                location: 'Kigali',
                link: 'https://whatifrwanda.org',
                deadline: '2026-12-31',
                status: 'active',
                createdBy: adminId
            },
            {
                title: 'HIT Labs 10,000 Digital Health Mentorship',
                description: 'Empowering 10,000 digital health entrepreneurs across Africa through capacity building and masterclasses.',
                type: 'training',
                provider: 'OAZIS Health',
                location: 'Online / Bugesera',
                link: 'https://oazis.rw',
                deadline: '2026-10-30',
                status: 'active',
                createdBy: adminId
            }
        ];

        await Opportunity.insertMany(opportunities);
        console.log('✅ Opportunities seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding opportunities:', error);
        process.exit(1);
    }
};

seedOpportunities();
