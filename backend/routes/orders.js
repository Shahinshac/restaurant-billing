const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { status, tableId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (tableId) filter.tableId = tableId;

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
    const { tableId, items, notes } = req.body;
    
    // Calculate total
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const gstAmount = subtotal * 0.05;
    const totalAmount = subtotal + gstAmount;

    // Run in transaction: create Order -> create OrderItems -> update Table status
    const result = await prisma.$transaction(async (tx) => {
       const tableObj = await tx.table.findUnique({ where: { id: tableId }});
       if (!tableObj) throw new Error("Table not found");

       // Auto-generate order Number
       const count = await tx.order.count();
       const orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;
       
       const order = await tx.order.create({
         data: {
           orderNumber,
           tableId,
           tableNumber: tableObj.tableNumber,
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

       const updateTable = await tx.table.update({
         where: { id: tableId },
         data: {
           status: 'OCCUPIED',
           currentOrderId: order.id,
           occupiedAt: tableObj.occupiedAt || new Date()
         }
       });

       return { order, updateTable };
    });

    const io = req.app.get('io');
    io.emit('order_created', { order: result.order });
    io.emit('kds_update', { action: 'new_order', order: result.order });
    io.emit('table_updated', { action: 'order_added', table: result.updateTable });

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
             }
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
        
        if (allReady && order.status === 'PREPARING') {
           order = await tx.order.update({
              where: { id: req.params.orderId },
              data: { status: 'READY' },
              include: { items: true, table: true }
           });
        } else {
           // just manually attach updated items to order object since we didn't update parent
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

module.exports = router;
