const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Note = require('../models/Note');

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await Note.deleteMany({});

    // Create tenants
    const acmeTenant = new Tenant({
      name: 'Acme Corporation',
      slug: 'acme',
      plan: 'free'
    });

    const globexTenant = new Tenant({
      name: 'Globex Corporation',
      slug: 'globex',
      plan: 'free'
    });

    await acmeTenant.save();
    await globexTenant.save();

    // Create users
    const acmeAdmin = new User({
      email: 'admin@acme.test',
      password: 'password',
      role: 'admin',
      tenantId: acmeTenant._id,
      isPro: true
    });

    const acmeUser = new User({
      email: 'user@acme.test',
      password: 'password',
      role: 'member',
      tenantId: acmeTenant._id
    });

    const globexAdmin = new User({
      email: 'admin@globex.test',
      password: 'password',
      role: 'admin',
      tenantId: globexTenant._id,
      isPro: true
    });

    const globexUser = new User({
      email: 'user@globex.test',
      password: 'password',
      role: 'member',
      tenantId: globexTenant._id
    });

    await acmeAdmin.save();
    await acmeUser.save();
    await globexAdmin.save();
    await globexUser.save();

    // Create sample notes
    const acmeNote1 = new Note({
      title: 'Welcome to Acme Notes',
      content: 'This is your first note in the Acme Corporation workspace. You can create, edit, and manage your notes here.',
      tenantId: acmeTenant._id,
      createdBy: acmeAdmin._id
    });

    const acmeNote2 = new Note({
      title: 'Project Planning',
      content: 'Meeting notes from the project planning session. Key deliverables and timelines discussed.',
      tenantId: acmeTenant._id,
      createdBy: acmeUser._id
    });

    const globexNote1 = new Note({
      title: 'Globex Team Meeting',
      content: 'Weekly team standup notes. Discussed progress on current initiatives and upcoming priorities.',
      tenantId: globexTenant._id,
      createdBy: globexAdmin._id
    });

    const globexNote2 = new Note({
      title: 'Client Feedback',
      content: 'Important feedback from our key client. Need to address concerns about delivery timeline.',
      tenantId: globexTenant._id,
      createdBy: globexUser._id
    });

    await acmeNote1.save();
    await acmeNote2.save();
    await globexNote1.save();
    await globexNote2.save();

    console.log('Database seeded successfully!');
    console.log('Test accounts created:');
    console.log('Acme Tenant:');
    console.log('  - admin@acme.test (admin)');
    console.log('  - user@acme.test (member)');
    console.log('Globex Tenant:');
    console.log('  - admin@globex.test (admin)');
    console.log('  - user@globex.test (member)');
    console.log('All passwords: password');

  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
};

module.exports = { seedDatabase };
