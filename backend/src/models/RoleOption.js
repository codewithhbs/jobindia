const mongoose = require('mongoose');

const roleOptionSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
        },
        desc: {
            type: String,
            required: true,
            trim: true,
        },
        icon: {
            type: String,
            required: true,
            trim: true,
            default: 'briefcase-outline',
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

roleOptionSchema.index({ order: 1 });

module.exports = mongoose.model('RoleOption', roleOptionSchema);