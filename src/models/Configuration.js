const mongoose = require("mongoose");

const configurationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  productSlug: {
    type: String,
    required: true
  },
  materials: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  components: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lightingPreset: {
    type: String,
    default: "studio"
  },
  exposure: {
    type: Number
  },
  camera: {
    azimuth: { type: Number, default: 0 },
    elevation: { type: Number, default: 15 },
    distance: { type: Number, default: 3 }
  },
  name: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Configuration", configurationSchema);
