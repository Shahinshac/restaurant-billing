const express = require('express');
const router = express.Router();
const prisma = require('../db');

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isAvailable: true };
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

module.exports = router;
