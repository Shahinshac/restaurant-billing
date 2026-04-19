const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Get all tables
router.get('/', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      include: {
         currentOrder: { include: { items: true } }
      },
      orderBy: { tableNumber: 'asc' }
    });
    res.json({ success: true, data: tables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single table
router.get('/:id', async (req, res) => {
  try {
    const table = await prisma.table.findUnique({
      where: { id: req.params.id },
      include: { currentOrder: { include: { items: true } } }
    });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, data: table });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update table status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, reservedFor } = req.body;
    const update = { status };
    if (reservedFor !== undefined) update.reservedFor = reservedFor;
    
    if (status === 'FREE') {
      update.currentOrderId = null;
      update.occupiedAt = null;
      update.reservedFor = '';
    }

    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: update,
      include: { currentOrder: true }
    });

    const io = req.app.get('io');
    io.emit('table_updated', { action: 'status_change', table });

    res.json({ success: true, data: table });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Free a table
router.post('/:id/free', async (req, res) => {
  try {
    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: {
        status: 'FREE',
        currentOrderId: null,
        occupiedAt: null,
        reservedFor: ''
      }
    });

    const io = req.app.get('io');
    io.emit('table_updated', { action: 'freed', table });

    res.json({ success: true, data: table });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Create table
router.post('/', async (req, res) => {
  try {
    const table = await prisma.table.create({
      data: req.body
    });
    res.status(201).json({ success: true, data: table });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete table
router.delete('/:id', async (req, res) => {
  try {
    await prisma.table.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Table deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
