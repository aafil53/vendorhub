require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User, Equipment, sequelize } = require('./models');

async function seed() {
  await sequelize.sync({ force: true });
  console.log('Database synced (force: true)');

  // Create users: 2 vendors, 1 client, 1 admin
  const password = await bcrypt.hash('123456', 10);

  const vendors = await Promise.all([
    User.create({ 
      email: 'hitachi@volvitech.com', 
      hashedPassword: password, 
      role: 'vendor', 
      name: 'Hitachi Admin',
      companyName: 'Hitachi Construction',
      contactName: 'Ken Tanaka',
      phone: '+81 90-1234-5678',
      categories: ['Crane', 'Excavator'],
      rating: 4.9,
      ordersCount: 25,
      experienceYears: 15
    }),
    User.create({ 
      email: 'gulf@volvitech.com', 
      hashedPassword: password, 
      role: 'vendor', 
      name: 'Gulf Fleet Manager',
      companyName: 'Gulf Equipment Rental',
      contactName: 'Ahmed Mansoor',
      phone: '+971 50-987-6543',
      categories: ['Excavator', 'Dozer', 'Mixer'],
      rating: 4.7,
      ordersCount: 12,
      experienceYears: 8
    }),
  ]);

  const client = await User.create({ 
    email: 'client@volvitech.com', 
    hashedPassword: password, 
    role: 'client', 
    name: 'Volvitech Client',
    companyName: 'Volvitech Construction'
  });

  const admin = await User.create({ 
    email: 'admin@volvitech.com', 
    hashedPassword: password, 
    role: 'admin', 
    name: 'System Admin' 
  });

  // Create 5 equipment items
  const equipments = await Promise.all([
    Equipment.create({ name: 'Excavator 3000', category: 'Excavator', specs: { hp: 250, weight: '30t' }, certReq: true, rentalPeriod: 30 }),
    Equipment.create({ name: 'Crane Pro X', category: 'Crane', specs: { capacity: '20t', reach: '40m' }, certReq: true, rentalPeriod: 14 }),
    Equipment.create({ name: 'Forklift 2t', category: 'Forklift', specs: { capacity: '2t' }, certReq: false, rentalPeriod: 7 }),
    Equipment.create({ name: 'Bulldozer B7', category: 'Dozer', specs: { hp: 180 }, certReq: false, rentalPeriod: 21 }),
    Equipment.create({ name: 'Concrete Mixer 500', category: 'Mixer', specs: { volume: '500L' }, certReq: false, rentalPeriod: 10 }),
  ]);

  console.log('Seeded:', { vendors: vendors.length, client: client.email, admin: admin.email, equipments: equipments.length });
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});