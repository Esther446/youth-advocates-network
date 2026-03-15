/**
 * seedTestUsers.js
 * Creates 3 reusable test accounts: Admin, Member, Applicant
 * Run: node seedTestUsers.js
 * Works on both local (MongoDB) and live (Atlas) depending on .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yan';

const TEST_USERS = [
  {
    name:         'YAN Admin',
    email:        'admin@yanrwanda.org',
    password:     'YanAdmin@2026',
    role:         'admin',
    organization: 'Youth Advocates Network',
    bio:          'Platform administrator for Youth Advocates Network Rwanda.'
  },
  {
    name:         'Jane Uwimana',
    email:        'member@yanrwanda.org',
    password:     'YanMember@2026',
    role:         'member',
    organization: 'Green Future Initiative',
    bio:          'Youth leader passionate about environmental advocacy.'
  },
  {
    name:         'Eric Habimana',
    email:        'applicant@yanrwanda.org',
    password:     'YanApplicant@2026',
    role:         'applicant',
    organization: 'Youth Voices Rwanda',
    bio:          'Applying to join the Youth Advocates Network.'
  }
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // We need the raw schema because the model file hashes on .save()
  const User = require('./src/models/User');

  for (const u of TEST_USERS) {
    const exists = await User.findOne({ email: u.email });

    if (exists) {
      // Update role + password in case it drifted
      const hash = await bcrypt.hash(u.password, 12);
      await User.findByIdAndUpdate(exists._id, {
        role:         u.role,
        password:     hash,
        organization: u.organization,
        bio:          u.bio
      });
      console.log(`🔄  Updated existing user: ${u.email} (${u.role})`);
    } else {
      // Let Mongoose pre-save hook hash the password
      await User.create(u);
      console.log(`✨  Created new user: ${u.email} (${u.role})`);
    }
  }

  // Also seed a sample pending application for the applicant
  const Application = require('./src/models/Application');
  const applicantUser = await User.findOne({ email: 'applicant@yanrwanda.org' });

  if (applicantUser) {
    const hasApp = await Application.findOne({ applicant: applicantUser._id });
    if (!hasApp) {
      await Application.create({
        applicant: applicantUser._id,
        status: 'submitted',
        submissionData: {
          orgLegalName:  'Youth Voices Rwanda',
          orgAcronym:    'YVR',
          yearEstablished: '2022',
          orgType: 'Youth-Led CBO',
          hqAddress: 'Kigali, Gasabo District',
          geoFocus: 'Kigali, Eastern Province',
          missionStatement: 'Empowering youth through civic education and peer advocacy.',
          repFullName: 'Eric Habimana',
          repEmail: 'applicant@yanrwanda.org',
          repPhone: '+250788000003',
          repRole: 'Executive Director',
          missionAlignment: 'Our mission aligns with YAN through shared goals of youth empowerment and advocacy.',
          skillsContribution: 'Project management, advocacy training, community mobilization.',
          learnGrow: 'We hope to expand our network and learn best practices from other member organizations.',
          organization: { name: 'Youth Voices Rwanda' }
        }
      });
      console.log('📝  Created sample application for applicant@yanrwanda.org');
    } else {
      console.log('📝  Application already exists for applicant@yanrwanda.org');
    }
  }

  console.log('\n══════════════════════════════════════════');
  console.log('  TEST CREDENTIALS (use on local & live)');
  console.log('══════════════════════════════════════════');
  for (const u of TEST_USERS) {
    console.log(`  ${u.role.toUpperCase().padEnd(10)} | ${u.email} | ${u.password}`);
  }
  console.log('══════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('Done ✅');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
