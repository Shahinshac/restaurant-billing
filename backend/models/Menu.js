const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, default: '' },
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  prepTime: { type: Number, default: 10 }, // minutes
  image: { type: String, default: '' },
  tags: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Menu', menuSchema);
