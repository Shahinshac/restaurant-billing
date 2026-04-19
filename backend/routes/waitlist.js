const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Get all waitlist entries
router.get('/', async (req, res) => {
  try {
    const entries = await prisma.waitlist.findMany({
      where: {
        status: { in: ['WAITING', 'NOTIFIED'] }
      },
      include: { table: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add guest to waitlist
router.post('/', async (req, res) => {
  try {
    const { customerName, peopleCount, notes, customerPhone } = req.body;
    
    // Simple auto-increment logic for waitlistNumber if needed, 
    // but Prisma handles it if specified as autoincrement()
    const entry = await prisma.waitlist.create({
      data: {
        customerName,
        peopleCount: parseInt(peopleCount) || 2,
        notes: notes || '',
        status: 'WAITING'
      }
    });

    const io = req.app.get('io');
    io.emit('waitlist_updated', { action: 'added', entry });

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update waitlist status (NOTIFIED, CANCELLED)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const entry = await prisma.waitlist.update({
      where: { id: req.params.id },
      data: { status }
    });

    const io = req.app.get('io');
    io.emit('waitlist_updated', { action: 'status_change', entry });

    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Assign table and mark as SEATED
router.post('/:id/assign', async (req, res) => {
  try {
    const { tableId } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update waitlist entry
      const entry = await tx.waitlist.update({
        where: { id: req.params.id },
        data: { 
          status: 'ASSIGNED',
          assignedTableId: tableId 
        }
      });

      // 2. Update table status
      const table = await tx.table.update({
        where: { id: tableId },
        data: { 
          status: 'OCCUPIED',
          occupiedAt: new Date()
        }
      });

      return { entry, table };
    });

    const io = req.app.get('io');
    io.emit('waitlist_updated', { action: 'seated', entry: result.entry });
    io.emit('table_updated', { action: 'status_change', table: result.table });

    res.json({ success: true, data: result.entry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete/Cancel entry
router.delete('/:id', async (req, res) => {
  try {
    await prisma.waitlist.delete({
      where: { id: req.params.id }
    });
    
    const io = req.app.get('io');
    io.emit('waitlist_updated', { action: 'deleted', id: req.params.id });

    res.json({ success: true, message: 'Removed from waitlist' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
