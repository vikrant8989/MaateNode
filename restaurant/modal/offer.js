const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerImage: {
        type: String,
        required: true,
        trim: true
    },
    offerTitle: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    discountAmount: {
        type: Number,
        required: true,
        min: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    }
}, {
    timestamps: true
});

// Index for better query performance
offerSchema.index({ restaurantId: 1 });
offerSchema.index({ startDate: 1, endDate: 1 });

// Virtual for checking if offer is currently valid
offerSchema.virtual('isValid').get(function() {
    const now = new Date();
    return this.startDate <= now && this.endDate >= now;
});

// Static method to find active offers
offerSchema.statics.findActiveOffers = function(restaurantId) {
    const now = new Date();
    return this.find({
        restaurantId: restaurantId,
        startDate: { $lte: now },
        endDate: { $gte: now }
    });
};

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
