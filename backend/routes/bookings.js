const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { table: true },
      orderBy: { bookingDate: 'asc' },
    });
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create booking
router.post('/', async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      customerEmail, 
      partySize, 
      bookingDate, 
      specialRequests,
      tableId 
    } = req.body;

    const booking = await prisma.booking.create({
      data: {
        customerName,
        customerPhone,
        customerEmail,
        partySize: parseInt(partySize),
        bookingDate: new Date(bookingDate),
        specialRequests: specialRequests || '',
        tableId: tableId || null,
        status: 'CONFIRMED'
      },
      include: { table: true }
    });

    const io = req.app.get('io');
    io.emit('booking_created', { booking });

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, tableId } = req.body;
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { 
        status,
        tableId: tableId !== undefined ? tableId : undefined
      },
      include: { table: true }
    });

    const io = req.app.get('io');
    io.emit('booking_updated', { booking });

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete booking
router.delete('/:id', async (req, res) => {
  try {
    await prisma.booking.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
