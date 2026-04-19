const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { status, tableId, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (tableId) filter.tableId = tableId;
    if (type) filter.orderType = type;

    const orders = await prisma.order.findMany({
      where: filter,
      include: { table: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get KDS orders (pending/preparing/ready)
router.get('/kds', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ['PENDING', 'PREPARING', 'READY'] } },
      include: { table: true, items: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get customers status orders (preparing/ready)
router.get('/status-board', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { 
        status: { in: ['PENDING', 'PREPARING', 'READY'] }
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        orderType: true,
        tableNumber: true
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { table: true, items: true }
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create order + items using transaction
router.post('/', async (req, res) => {
  try {
    const { tableId, items, notes, orderType, customerName, customerPhone, customerEmail } = req.body;
    
    // Calculate total
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const gstAmount = subtotal * 0.05;
    const totalAmount = subtotal + gstAmount;

    // Run in transaction
    const result = await prisma.$transaction(async (tx) => {
       let tableObj = null;
       if (tableId) {
         tableObj = await tx.table.findUnique({ where: { id: tableId }});
       }

       // Auto-generate order Number
       const count = await tx.order.count();
       const orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;
       
       const order = await tx.order.create({
         data: {
           orderNumber,
           orderType: orderType || 'DINE_IN',
           customerName: customerName || '',
           customerPhone: customerPhone || '',
           customerEmail: customerEmail || '',
           paymentStatus: req.body.paymentStatus || 'unpaid',
           paymentMethod: req.body.paymentMethod || 'pending',
           tableId: tableId || null,
           tableNumber: tableObj ? tableObj.tableNumber : null,
           subtotal,
           gstAmount,
           totalAmount,
           notes: notes || '',
           items: {
             create: items.map(i => ({
               menuItemId: i.menuItemId || i.menuItem || null,
               itemName: i.name || i.itemName,
               price: i.price,
               quantity: i.quantity,
               notes: i.notes || '',
             }))
           }
         },
         include: { items: true, table: true }
       });

       let updateTable = null;
       if (tableId && orderType !== 'TAKEAWAY') {
          updateTable = await tx.table.update({
            where: { id: tableId },
            data: {
              status: 'OCCUPIED',
              currentOrderId: order.id,
              occupiedAt: new Date()
            },
            include: { currentOrder: { include: { items: true } } }
          });
       }

       return { order, updateTable };
    });

    const io = req.app.get('io');
    io.emit('order_created', { order: result.order });
    io.emit('kds_update', { action: 'new_order', order: result.order });
    if (result.updateTable) {
      io.emit('table_updated', { action: 'order_added', table: result.updateTable });
    }

    res.status(201).json({ success: true, data: result.order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Process payment
router.post('/:id/pay', async (req, res) => {
  try {
    const { paymentMethod, splitPayments } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
       const order = await tx.order.update({
         where: { id: req.params.id },
         data: {
           paymentMethod,
           paymentStatus: 'paid',
           status: 'COMPLETED',
           splitPayments: splitPayments || [],
         },
         include: { table: true, items: true }
       });

       let updatedTable = null;
       if (order.tableId) {
           updatedTable = await tx.table.update({
              where: { id: order.tableId },
              data: {
                status: 'FREE',
                currentOrderId: null,
                occupiedAt: null
              },
              include: { currentOrder: { include: { items: true } } }
           });
       }

       return { order, updatedTable };
    });

    const io = req.app.get('io');
    io.emit('order_updated', { order: result.order });
    if (result.updatedTable) {
       io.emit('table_updated', { action: 'freed', table: result.updatedTable });
    }

    res.json({ success: true, data: result.order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update order status (KDS)
router.patch('/:id/status', async (req, res) => {
  try {
     const order = await prisma.order.update({
        where: { id: req.params.id },
        data: { status: req.body.status },
        include: { items: true, table: true }
     });

     const io = req.app.get('io');
     io.emit('order_updated', { order });
     io.emit('kds_update', { action: 'status_change', order });

     res.json({ success: true, data: order });
  } catch(err) {
     res.status(400).json({ success: false, message: err.message });
  }
});

// Update item status (KDS)
router.patch('/:orderId/items/:itemId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await prisma.$transaction(async (tx) => {
        const item = await tx.orderItem.update({
          where: { id: req.params.itemId },
          data: { status }
        });

        const allItems = await tx.orderItem.findMany({ where: { orderId: req.params.orderId } });
        const allReady = allItems.every(i => i.status === 'READY' || i.status === 'COMPLETED');
        
        let order = await tx.order.findUnique({ where: { id: req.params.orderId }, include: { items: true, table: true } });
        
        if (allReady && (order.status === 'PREPARING' || order.status === 'PENDING')) {
           order = await tx.order.update({
              where: { id: req.params.orderId },
              data: { status: 'READY' },
              include: { items: true, table: true }
           });
        } else {
           order.items = allItems.map(i => i.id === item.id ? item : i);
        }
        return order;
    });

    const io = req.app.get('io');
    io.emit('order_updated', { order: result });
    io.emit('kds_update', { action: 'item_status', order: result });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Add items to existing order
router.post('/:id/add-items', async (req, res) => {
  try {
    const { items } = req.body;
    const orderId = req.params.id;

    const result = await prisma.$transaction(async (tx) => {
      // Create new order items
      await tx.orderItem.createMany({
        data: items.map(i => ({
          orderId,
          menuItemId: i.menuItemId || i.menuItem || null,
          itemName: i.name || i.itemName,
          price: i.price,
          quantity: i.quantity,
          status: 'PENDING'
        }))
      });

      // Recalculate totals
      const allItems = await tx.orderItem.findMany({ where: { orderId } });
      const subtotal = allItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      const gstAmount = subtotal * 0.05;
      const totalAmount = subtotal + gstAmount;

      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal,
          gstAmount,
          totalAmount,
          status: 'PENDING' // Set back to pending so KDS sees it
        },
        include: { items: true, table: true }
      });

      return order;
    });

    const io = req.app.get('io');
    io.emit('order_updated', { order: result });
    io.emit('kds_update', { action: 'items_added', order: result });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
