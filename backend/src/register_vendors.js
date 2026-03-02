require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User, sequelize } = require('./models');

async function registerVendors() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // 1. Password hash
    const password = await bcrypt.hash('123', 10);

    // 2. Vendor Data
    const vendors = [
      {
        email: 'hitachi@volvitech.com',
        name: 'Hitachi Heavy Industries',
        companyName: 'Hitachi Heavy Industries',
        phone: '+966 50 123 4567',
        contactName: 'Ahmed Al-Hitachi',
        categories: ['Cranes', 'Excavators'],
        certifications: ['ARAMCO', 'ISO 9001'],
        rating: 4.8,
        ordersCount: 120,
        experienceYears: 15
      },
      {
        email: 'gulf@gulf.com',
        name: 'Gulf Equipment Co.',
        companyName: 'Gulf Equipment Co.',
        phone: '+966 55 987 6543',
        contactName: 'Mohammed Gulf',
        categories: ['Excavators', 'Bulldozers'],
        certifications: ['Third-Party'],
        rating: 4.5,
        ordersCount: 85,
        experienceYears: 8
      },
      {
        email: 'arabian@equip.com',
        name: 'Arabian Heavy Lift',
        companyName: 'Arabian Heavy Lift',
        phone: '+966 54 555 1212',
        contactName: 'Saleh Arabian',
        categories: ['Bulldozers', 'Cranes', 'Forklifts'],
        certifications: ['ARAMCO', 'Labour'],
        rating: 4.9,
        ordersCount: 200,
        experienceYears: 20
      }
    ];

    // 3. Register Loop
    for (const v of vendors) {
      const existing = await User.findOne({ where: { email: v.email } });
      if (existing) {
        console.log(`Vendor ${v.email} already exists. Updating...`);
        await existing.update({
             ...v,
             role: 'vendor',
             // Don't overwrite password if exists, or do? Let's keep it if exists, else it would be problematic if someone changed it.
             // But for test reliability, maybe ensure it is '123' if we are "resetting".
             // Let's safe-update.
        });
      } else {
        console.log(`Creating vendor ${v.email}...`);
        await User.create({
          ...v,
          hashedPassword: password,
          role: 'vendor'
        });
      }
    }

    console.log('✅ 3 Real Vendors Registered Successfully');
    process.exit(0);

  } catch (error) {
    console.error('Error registering vendors:', error);
    process.exit(1);
  }
}

registerVendors();
