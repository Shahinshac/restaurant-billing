const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true, unique: true },
  capacity: { type: Number, required: true },
  status: {
    type: String,
    enum: ['free', 'occupied', 'reserved', 'cleaning'],
    default: 'free'
  },
  section: { type: String, default: 'Main Hall' },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  currentQueue: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue', default: null },
  occupiedAt: { type: Date, default: null },
  reservedFor: { type: String, default: '' },
  posX: { type: Number, default: 0 },
  posY: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
