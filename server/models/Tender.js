const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema(
  {
    // General Information
    employeeName: {
      type: String,
      required: [true, 'Employee/Company name is required'],
      trim: true,
    },
    companyEmail: {
      type: String,
      required: [true, 'Company email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    employerOfficeName: {
      type: String,
      required: [true, 'Employer office name is required'],
      trim: true,
    },
    employerEmail: {
      type: String,
      required: [true, 'Employer email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    // Contract Details
    contractNumber: {
      type: String,
      required: [true, 'Contract number is required'],
      unique: true,
      trim: true,
    },
    contractTitle: {
      type: String,
      required: [true, 'Contract title is required'],
      trim: true,
    },
    workDescription: {
      type: String,
      trim: true,
    },
    contractDate: {
      type: Date,
      required: [true, 'Contract date is required'],
    },
    contractType: {
      type: String,
      required: [true, 'Contract type is required'],
      enum: ['Bepiyani', 'Unit Rate', 'Lump Sum', 'Cost Plus', 'Time and Material', 'Other'],
    },
    contractStartDate: {
      type: Date,
      required: [true, 'Contract start date is required'],
    },
    contractEndDate: {
      type: Date,
      required: [true, 'Contract end date is required'],
    },
    contractExtension: {
      type: Date,
      default: null,
    },

    // Financial Details
    contractAmount: {
      type: Number,
      required: [true, 'Contract amount is required'],
      min: [0, 'Contract amount must be positive'],
    },
    vatIncluded: {
      type: Boolean,
      default: false,
    },

    // Status
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Expired', 'Cancelled'],
      default: 'Active',
    },

    // Documents
    bidNoticeFiles: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        resource_type: { type: String, default: 'raw' },
        file_name: { type: String, required: true },
        file_type: { type: String, required: true },
        category: { type: String, default: 'Bid Notice' },
      },
    ],
    contractFiles: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        resource_type: { type: String, default: 'raw' },
        file_name: { type: String, required: true },
        file_type: { type: String, required: true },
        category: { type: String, default: 'Contract Document' },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for bank guarantees
tenderSchema.virtual('bankGuarantees', {
  ref: 'BankGuarantee',
  localField: '_id',
  foreignField: 'tenderId',
});

// Index for search
tenderSchema.index({ contractNumber: 'text', employeeName: 'text', contractTitle: 'text' });

module.exports = mongoose.model('Tender', tenderSchema);
