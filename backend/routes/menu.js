const express = require('express');
const router = express.Router();
const prisma = require('../db');

router.get('/', async (req, res) => {
  try {
    const { category, all } = req.query;
    const filter = {};
    if (!all) filter.isAvailable = true;
    if (category && category !== 'All') filter.category = category;

    const menu = await prisma.menuItem.findMany({
       where: filter,
       orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    res.json({ success: true, data: menu });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
       select: { category: true },
       distinct: ['category']
    });
    res.json({ success: true, data: items.map(i => i.category) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create menu item
router.post('/', async (req, res) => {
  try {
    const item = await prisma.menuItem.create({
      data: req.body
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update menu item
router.put('/:id', async (req, res) => {
  try {
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete menu item
router.delete('/:id', async (req, res) => {
  try {
    await prisma.menuItem.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
