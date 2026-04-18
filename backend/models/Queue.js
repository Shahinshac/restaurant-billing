const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  partySize: { type: Number, required: true, min: 1 },
  phone: { type: String, default: '' },
  status: {
    type: String,
    enum: ['waiting', 'ready', 'assigned', 'cancelled'],
    default: 'waiting'
  },
  qrCode: { type: String, default: '' },
  queueNumber: { type: Number },
  estimatedWait: { type: Number, default: 0 }, // minutes
  assignedTable: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Queue', queueSchema);
