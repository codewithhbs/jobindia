const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    fieldId: String,
    fieldName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { _id: true }
);

/**
 * DriverProfile — vehicle + licence + documents for driver-type accounts.
 * dynamicFields Map removed; everything is now typed.
 */
const driverProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    vehicleTypes: [
      { type: String, enum: ['bike', 'auto', 'car', 'van', 'truck', 'heavy'] },
    ],
    vehicleNumber: String,
    vehicleModel: String,

    licenseNumber: String,
    licenseExpiry: Date,

    yearsOfExperience: { type: Number, default: 0 },
    preferredRoutes: [String],

    isAvailable: { type: Boolean, default: true },

    documents: [documentSchema],
  },
  { timestamps: true }
);

const DriverProfile = mongoose.model('DriverProfile', driverProfileSchema);

module.exports = DriverProfile;
