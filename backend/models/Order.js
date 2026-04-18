const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  category: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served'],
    default: 'pending'
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  tableNumber: { type: Number, required: true },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'billed', 'paid'],
    default: 'pending'
  },
  subtotal: { type: Number, default: 0 },
  gstRate: { type: Number, default: 5 }, // percentage
  gstAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'pending', 'split'],
    default: 'pending'
  },
  splitPayments: [{
    method: { type: String, enum: ['cash', 'card', 'upi'] },
    amount: { type: Number }
  }],
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  notes: { type: String, default: '' },
  servedBy: { type: String, default: 'Staff' },
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;
  }
  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.gstAmount = parseFloat((this.subtotal * this.gstRate / 100).toFixed(2));
  this.total = parseFloat((this.subtotal + this.gstAmount).toFixed(2));
  next();
});

module.exports = mongoose.model('Order', orderSchema);
