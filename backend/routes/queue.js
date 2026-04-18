const express = require('express');
const router = express.Router();
const prisma = require('../db');
const QRCode = require('qrcode');

// Helper: Estimate wait time
const estimateWaitTime = async (position) => {
  return Math.max(5, position * 15);
};

// Get active queue
router.get('/', async (req, res) => {
  try {
    const queue = await prisma.queue.findMany({
      where: { status: { in: ['WAITING', 'READY'] } },
      include: { table: true },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, data: queue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add to queue
router.post('/', async (req, res) => {
  try {
    const { customerName, partySize, phone, notes } = req.body;
    
    const waitingCount = await prisma.queue.count({ where: { status: 'WAITING' } });
    const queueNumber = waitingCount + 1;
    const estimatedWait = await estimateWaitTime(queueNumber);

    const entry = await prisma.queue.create({
      data: {
        customerName,
        peopleCount: partySize || 2,
        phone: phone || '',
        notes: notes || '',
        status: 'WAITING',
        estimatedWait,
      }
    });

    // Generate QR code
    const qrData = JSON.stringify({ id: entry.id, name: customerName, party: partySize, queue: entry.queueNumber });
    const qrCode = await QRCode.toDataURL(qrData);

    const updatedEntry = await prisma.queue.update({
       where: { id: entry.id },
       data: { qrCode }
    });

    const io = req.app.get('io');
    io.emit('queue_updated', { action: 'add', entry: updatedEntry });

    res.status(201).json({ success: true, data: updatedEntry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const entry = await prisma.queue.update({
      where: { id: req.params.id },
      data: { status },
      include: { table: true }
    });

    const io = req.app.get('io');
    io.emit('queue_updated', { action: 'status_change', entry });

    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Auto-assign table
router.post('/:id/auto-assign', async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
       const queueEntry = await tx.queue.findUnique({ where: { id: req.params.id } });
       if (!queueEntry) throw new Error("Queue entry not found");

       const suitableTable = await tx.table.findFirst({
         where: { status: 'FREE', capacity: { gte: queueEntry.peopleCount } },
         orderBy: { capacity: 'asc' }
       });

       if (!suitableTable) throw new Error("No suitable table available");

       const updatedTable = await tx.table.update({
          where: { id: suitableTable.id },
          data: { status: 'OCCUPIED', occupiedAt: new Date() }
       });

       const updatedQueue = await tx.queue.update({
          where: { id: queueEntry.id },
          data: { status: 'ASSIGNED', assignedTableId: suitableTable.id }
       });

       return { queueEntry: updatedQueue, table: updatedTable };
    });

    const io = req.app.get('io');
    io.emit('queue_updated', { action: 'assigned', entry: result.queueEntry });
    io.emit('table_updated', { action: 'occupied', table: result.table });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
