const mongoose = require('mongoose');

const bankGuaranteeSchema = new mongoose.Schema(
  {
    tenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tender',
      required: [true, 'Tender reference is required'],
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
    },
    guaranteeType: {
      type: String,
      required: [true, 'Guarantee type is required'],
      enum: [
        'Bid Bond',
        'Performance Guarantee',
        'Advance Guarantee',
        'Retention Guarantee',
        'Warranty Guarantee',
        'Other',
      ],
    },
    guaranteeNumber: {
      type: String,
      required: [true, 'Guarantee number is required'],
      trim: true,
    },
    guaranteeAmount: {
      type: Number,
      required: [true, 'Guarantee amount is required'],
      min: [0, 'Guarantee amount must be positive'],
    },
    issuedDate: {
      type: Date,
      required: [true, 'Issued date is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    documentUrl: {
      type: String,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Released', 'Claimed'],
      default: 'Active',
    },

    // Owner (inherited from parent tender's user)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Documents
    guaranteeFiles: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        resource_type: { type: String, default: 'raw' },
        file_name: { type: String, required: true },
        file_type: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Validate expiry date > issued date
bankGuaranteeSchema.pre('save', function (next) {
  if (this.expiryDate <= this.issuedDate) {
    return next(new Error('Expiry date must be after issued date'));
  }
  next();
});

// Auto-update status based on expiry
bankGuaranteeSchema.pre('save', function (next) {
  if (this.status === 'Active' && this.expiryDate < new Date()) {
    this.status = 'Expired';
  }
  next();
});

module.exports = mongoose.model('BankGuarantee', bankGuaranteeSchema);
