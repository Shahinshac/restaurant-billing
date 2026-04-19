const express = require('express');
const router = express.Router();
const prisma = require('../db');

// Add summary route handling aggregation logic manually since Prisma aggregate doesn't match Mongo's identically
router.get('/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrdersToday,
      totalOrdersAllTime,
      activeTablesCount,
      waitingQueueCount
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count(),
      prisma.table.count({ where: { status: 'OCCUPIED' } }),
      prisma.waitlist.count({ where: { status: 'WAITING' } })
    ]);

    const todayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: today }, paymentStatus: 'paid' },
      select: { totalAmount: true }
    });
    const revenueToday = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = await prisma.order.findMany({
       where: { createdAt: { gte: last7Days } },
       select: { createdAt: true, totalAmount: true, paymentStatus: true }
    });

    const hoursCount = {};
    const revenueByDayMap = {};
    
    recentOrders.forEach(order => {
        const h = order.createdAt.getHours();
        hoursCount[h] = (hoursCount[h] || 0) + 1;

        if (order.paymentStatus === 'paid') {
           const d = order.createdAt.toISOString().split('T')[0];
           if (!revenueByDayMap[d]) revenueByDayMap[d] = { revenue: 0, orders: 0 };
           revenueByDayMap[d].revenue += order.totalAmount;
           revenueByDayMap[d].orders += 1;
        }
    });

    const peakHours = Object.keys(hoursCount)
        .map(h => ({ hour: Number(h), count: hoursCount[h] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    const revenueByDay = Object.keys(revenueByDayMap)
        .sort()
        .map(d => ({ _id: d, revenue: revenueByDayMap[d].revenue, orders: revenueByDayMap[d].orders }));

    const waitQueues = await prisma.waitlist.findMany({
        where: { status: { in: ['ASSIGNED', 'WAITING'] } },
        select: { estimatedWait: true }
    });
    const avgWaitTime = waitQueues.length > 0 ? waitQueues.reduce((sum, q) => sum + q.estimatedWait, 0) / waitQueues.length : 0;

    res.json({
      success: true,
      data: {
        totalOrdersToday,
        revenueToday: parseFloat(revenueToday.toFixed(2)),
        activeTablesCount,
        waitingQueueCount,
        totalOrdersAllTime,
        peakHours,
        avgWaitTime: Math.round(avgWaitTime),
        revenueByDay,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
