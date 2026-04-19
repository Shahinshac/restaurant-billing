const prisma = require('../db');

const MENU_ITEMS = [
  // Appetizers/Starters
  { name: 'Paneer Tikka', category: 'Appetizers', price: 280, isVeg: true, description: 'Grilled cottage cheese marinated in spices', prepTime: 12 },
  { name: 'Hara Bhara Kabab', category: 'Appetizers', price: 240, isVeg: true, description: 'Spinach and pea patties with Indian herbs', prepTime: 10 },
  { name: 'Chicken Seekh Kabab', category: 'Appetizers', price: 340, isVeg: false, description: 'Minced chicken skewers cooked in tandoor', prepTime: 15 },
  { name: 'Crispy Corn', category: 'Appetizers', price: 210, isVeg: true, description: 'Deep fried corn kernels with lemon and chili', prepTime: 8 },
  { name: 'Tandoori Soya Chaap', category: 'Appetizers', price: 260, isVeg: true, description: 'Soya chunks marinated in yogurt and spices', prepTime: 12 },
  
  // Signature Mains
  { name: 'Butter Chicken', category: 'Main Course', price: 420, isVeg: false, description: 'Tender chicken in rich creamy tomato gravy', prepTime: 20 },
  { name: 'Dal Makhani', category: 'Main Course', price: 320, isVeg: true, description: 'Slow-cooked black lentils with cream and butter', prepTime: 18 },
  { name: 'Paneer Butter Masala', category: 'Main Course', price: 360, isVeg: true, description: 'Cottage cheese in silky tomato butter sauce', prepTime: 18 },
  { name: 'Mutton Rogan Josh', category: 'Main Course', price: 490, isVeg: false, description: 'Kashmiri style mutton curry with aromatic spices', prepTime: 25 },
  { name: 'Kadai Chicken', category: 'Main Course', price: 390, isVeg: false, description: 'Spicy chicken cooked in a traditional kadai', prepTime: 20 },
  { name: 'Malai Kofta', category: 'Main Course', price: 340, isVeg: true, description: 'Fried potato-paneer balls in creamy gravy', prepTime: 22 },
  
  // Biryani & Rice
  { name: 'Hyderabadi Veg Biryani', category: 'Rice', price: 340, isVeg: true, description: 'Aromatic basmati rice with seasonal veggies', prepTime: 25 },
  { name: 'Lucknowi Chicken Biryani', category: 'Rice', price: 420, isVeg: false, description: 'Fragrant chicken biryani with saffron hint', prepTime: 25 },
  { name: 'Jeera Rice', category: 'Rice', price: 180, isVeg: true, description: 'Basmati rice tempered with cumin seeds', prepTime: 10 },
  { name: 'Steamed Basmati', category: 'Rice', price: 150, isVeg: true, description: 'Plain long-grain basmati rice', prepTime: 8 },
  
  // Breads (Tandoor)
  { name: 'Butter Naan', category: 'Breads', price: 60, isVeg: true, description: 'Refined flour bread with butter', prepTime: 5 },
  { name: 'Garlic Naan', category: 'Breads', price: 80, isVeg: true, description: 'Naan topped with chopped garlic', prepTime: 5 },
  { name: 'Tandoori Roti', category: 'Breads', price: 40, isVeg: true, description: 'Whole wheat bread from clay oven', prepTime: 5 },
  { name: 'Laccha Paratha', category: 'Breads', price: 75, isVeg: true, description: 'Layered whole wheat bread', prepTime: 7 },
  
  // Desserts
  { name: 'Gulab Jamun (2pcs)', category: 'Desserts', price: 120, isVeg: true, description: 'Milk dumplings in cardamom syrup', prepTime: 5 },
  { name: 'Moong Dal Halwa', category: 'Desserts', price: 160, isVeg: true, description: 'Roasted lentil pudding with nuts/ghee', prepTime: 10 },
  { name: 'Rasmalai (2pcs)', category: 'Desserts', price: 140, isVeg: true, description: 'Cheese discs in thickened saffron milk', prepTime: 5 },
  
  // Beverages
  { name: 'Mango Lassi', category: 'Beverages', price: 120, isVeg: true, description: 'Sweet mango and yogurt drink', prepTime: 5 },
  { name: 'Masala Chai', category: 'Beverages', price: 60, isVeg: true, description: 'Traditional spiced Indian tea', prepTime: 5 },
  { name: 'Fresh Lime Soda', category: 'Beverages', price: 90, isVeg: true, description: 'Refreshing sweet/salted lime soda', prepTime: 3 },
];

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
    console.log('🧹 Clearing existing data...');
    await prisma.booking.deleteMany();
    await prisma.table.updateMany({ data: { currentOrderId: null } });
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.queue.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.table.deleteMany();

    console.log('🌱 Seeding Menu Items...');
    await prisma.menuItem.createMany({ data: MENU_ITEMS });
    const menuItems = await prisma.menuItem.findMany();

    console.log('🪑 Seeding Tables...');
    await prisma.table.createMany({ data: TABLES });
    const tables = await prisma.table.findMany();

    console.log('📝 Seeding Historical Orders...');
    // Create some historical completed orders
    for (let i = 0; i < 20; i++) {
      const isTakeaway = i % 4 === 0;
      const table = isTakeaway ? null : tables[Math.floor(Math.random() * tables.length)];
      const itemCount = Math.floor(Math.random() * 3) + 2;
      const orderItemsData = [];
      let subtotal = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const item = menuItems[Math.floor(Math.random() * menuItems.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        subtotal += item.price * qty;
        orderItemsData.push({
          menuItemId: item.id,
          itemName: item.name,
          category: item.category,
          price: item.price,
          quantity: qty,
          status: 'COMPLETED'
        });
      }

      const gst = subtotal * 0.05;
      const total = subtotal + gst;

      await prisma.order.create({
        data: {
          orderNumber: `ORD-${2000 + i}`,
          orderType: isTakeaway ? 'TAKEAWAY' : 'DINE_IN',
          customerName: isTakeaway ? 'Walking Guest' : '',
          tableId: table?.id || null,
          tableNumber: table?.tableNumber || null,
          status: 'COMPLETED',
          subtotal: subtotal,
          gstAmount: gst,
          totalAmount: total,
          paymentMethod: i % 2 === 0 ? 'cash' : 'upi',
          paymentStatus: 'paid',
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)),
          items: {
            create: orderItemsData
          }
        }
      });
    }

    console.log('📅 Seeding Table Bookings...');
    const bookingData = [
      {
        customerName: 'Vikram Singh',
        customerPhone: '9876543210',
        customerEmail: 'vikram@example.com',
        partySize: 6,
        bookingDate: new Date(Date.now() + 86400000), // Tomorrow
        specialRequests: 'Birthday dinner - Need a cake and quiet corner.',
        status: 'CONFIRMED'
      },
      {
        customerName: 'Anjali Sharma',
        customerPhone: '9988776655',
        customerEmail: 'anjali@example.com',
        partySize: 2,
        bookingDate: new Date(Date.now() + 172800000), // Day after tomorrow
        specialRequests: 'Window seat if possible, baby chair needed.',
        status: 'CONFIRMED'
      }
    ];
    await prisma.booking.createMany({ data: bookingData });

    console.log('👥 Seeding Customer Queue...');
    const queueData = [
      { customerName: 'Rahul Sharma', peopleCount: 4, status: 'WAITING', estimatedWait: 15 },
      { customerName: 'Priya Patel', peopleCount: 2, status: 'WAITING', estimatedWait: 10 },
      { customerName: 'Amit Verma', peopleCount: 6, status: 'READY', estimatedWait: 5 },
    ];
    await prisma.queue.createMany({ data: queueData });

    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  }
};

module.exports = { seedDatabase };
