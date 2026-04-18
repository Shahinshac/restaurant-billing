const prisma = require('../db');

const MENU_ITEMS = [
  // Starters
  { name: 'Paneer Tikka', category: 'Starters', price: 280, isVeg: true, description: 'Grilled cottage cheese with spices', prepTime: 12 },
  { name: 'Chicken Wings', category: 'Starters', price: 320, isVeg: false, description: 'Crispy wings with hot sauce', prepTime: 15 },
  { name: 'Veg Spring Rolls', category: 'Starters', price: 180, isVeg: true, description: 'Crispy vegetable rolls', prepTime: 10 },
  { name: 'Soup of the Day', category: 'Starters', price: 120, isVeg: true, description: 'Chef\'s special soup', prepTime: 8 },
  { name: 'Garlic Bread', category: 'Starters', price: 140, isVeg: true, description: 'Toasted bread with garlic butter', prepTime: 7 },
  
  // Mains
  { name: 'Butter Chicken', category: 'Mains', price: 380, isVeg: false, description: 'Rich, creamy tomato curry with tender chicken', prepTime: 20 },
  { name: 'Dal Makhani', category: 'Mains', price: 280, isVeg: true, description: 'Slow-cooked black lentils', prepTime: 18 },
  { name: 'Biryani - Veg', category: 'Mains', price: 320, isVeg: true, description: 'Fragrant basmati rice with vegetables', prepTime: 25 },
  { name: 'Biryani - Chicken', category: 'Mains', price: 380, isVeg: false, description: 'Aromatic chicken biryani', prepTime: 25 },
  { name: 'Pasta Arrabbiata', category: 'Mains', price: 340, isVeg: true, description: 'Spicy tomato pasta', prepTime: 15 },
  { name: 'Grilled Fish', category: 'Mains', price: 480, isVeg: false, description: 'Whole grilled fish with herb butter', prepTime: 25 },
  { name: 'Paneer Butter Masala', category: 'Mains', price: 320, isVeg: true, description: 'Cottage cheese in creamy tomato gravy', prepTime: 18 },
  
  // Breads
  { name: 'Butter Naan', category: 'Breads', price: 60, isVeg: true, description: 'Soft leavened bread', prepTime: 5 },
  { name: 'Garlic Naan', category: 'Breads', price: 80, isVeg: true, description: 'Bread with garlic and butter', prepTime: 5 },
  { name: 'Tandoori Roti', category: 'Breads', price: 40, isVeg: true, description: 'Whole wheat bread from tandoor', prepTime: 5 },
  { name: 'Paratha', category: 'Breads', price: 70, isVeg: true, description: 'Layered whole wheat bread', prepTime: 7 },
  
  // Desserts
  { name: 'Gulab Jamun', category: 'Desserts', price: 120, isVeg: true, description: 'Soft milk dumplings in sugar syrup', prepTime: 5 },
  { name: 'Ice Cream', category: 'Desserts', price: 100, isVeg: true, description: 'Assorted flavors', prepTime: 3 },
  { name: 'Chocolate Brownie', category: 'Desserts', price: 160, isVeg: true, description: 'Warm brownie with ice cream', prepTime: 8 },
  { name: 'Rasmalai', category: 'Desserts', price: 140, isVeg: true, description: 'Cottage cheese in saffron milk', prepTime: 5 },
  
  // Beverages
  { name: 'Lassi (Sweet)', category: 'Beverages', price: 100, isVeg: true, description: 'Thick yogurt drink', prepTime: 3 },
  { name: 'Fresh Lime Soda', category: 'Beverages', price: 80, isVeg: true, description: 'Refreshing lime with soda', prepTime: 3 },
  { name: 'Mango Shake', category: 'Beverages', price: 140, isVeg: true, description: 'Fresh mango smoothie', prepTime: 5 },
  { name: 'Cold Coffee', category: 'Beverages', price: 160, isVeg: true, description: 'Iced coffee with cream', prepTime: 5 },
  { name: 'Masala Chai', category: 'Beverages', price: 60, isVeg: true, description: 'Spiced Indian tea', prepTime: 5 },
];

const TABLES = [
  { tableNumber: 1, capacity: 2, section: 'Window', posX: 0, posY: 0 },
  { tableNumber: 2, capacity: 2, section: 'Window', posX: 1, posY: 0 },
  { tableNumber: 3, capacity: 4, section: 'Main Hall', posX: 2, posY: 0 },
  { tableNumber: 4, capacity: 4, section: 'Main Hall', posX: 3, posY: 0 },
  { tableNumber: 5, capacity: 4, section: 'Main Hall', posX: 0, posY: 1 },
  { tableNumber: 6, capacity: 6, section: 'Main Hall', posX: 1, posY: 1 },
  { tableNumber: 7, capacity: 6, section: 'Main Hall', posX: 2, posY: 1 },
  { tableNumber: 8, capacity: 8, section: 'Private', posX: 3, posY: 1 },
  { tableNumber: 9, capacity: 8, section: 'Private', posX: 0, posY: 2 },
  { tableNumber: 10, capacity: 2, section: 'Bar', posX: 1, posY: 2 },
  { tableNumber: 11, capacity: 4, section: 'Outdoor', posX: 2, posY: 2 },
  { tableNumber: 12, capacity: 4, section: 'Outdoor', posX: 3, posY: 2 },
];

const seedDatabase = async () => {
  try {
    const menuCount = await prisma.menuItem.count();
    if (menuCount === 0) {
      await prisma.menuItem.createMany({ data: MENU_ITEMS });
      console.log(`✅ Seeded ${MENU_ITEMS.length} menu items`);
    }

    const tableCount = await prisma.table.count();
    if (tableCount === 0) {
      await prisma.table.createMany({ data: TABLES });
      console.log(`✅ Seeded ${TABLES.length} tables`);
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

module.exports = { seedDatabase };
