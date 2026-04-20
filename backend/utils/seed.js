const prisma = require('../db');

const TABLES = [
  { tableNumber: 1, capacity: 2, section: 'Window View', posX: 0, posY: 0 },
  { tableNumber: 2, capacity: 2, section: 'Window View', posX: 1, posY: 0 },
  { tableNumber: 3, capacity: 4, section: 'Main Hall', posX: 2, posY: 0 },
  { tableNumber: 4, capacity: 4, section: 'Main Hall', posX: 3, posY: 0 },
  { tableNumber: 5, capacity: 6, section: 'Family Zone', posX: 0, posY: 1 },
  { tableNumber: 6, capacity: 6, section: 'Family Zone', posX: 1, posY: 1 },
  { tableNumber: 7, capacity: 8, section: 'Private Room', posX: 2, posY: 1 },
  { tableNumber: 8, capacity: 10, section: 'Grand Suite', posX: 3, posY: 1 },
];

const seedDatabase = async () => {
  try {
    // Only create tables if none exist — never wipe existing data
    const tableCount = await prisma.table.count();
    if (tableCount === 0) {
      console.log('🪑 No tables found — creating default tables...');
      await prisma.table.createMany({ data: TABLES });
      console.log('✅ Tables created.');
    } else {
      console.log(`✅ ${tableCount} tables already exist — skipping seed.`);
    }
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  }
};

module.exports = { seedDatabase };
