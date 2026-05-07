/**
 * Seed script to populate the database with sample data
 * Run: node server/seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Tender = require('./models/Tender');
const BankGuarantee = require('./models/BankGuarantee');

const tenders = [
  {
    employeeName: 'Himalayan Construction Pvt. Ltd.',
    companyEmail: 'info@himalayan.com.np',
    employerOfficeName: 'Department of Roads, Kathmandu',
    employerEmail: 'dor@gov.np',
    contractNumber: 'CTR-2024-001',
    contractTitle: 'Construction of Kathmandu Ring Road Extension',
    workDescription: 'Construction of 12km ring road extension including bridges and drainage systems',
    contractDate: new Date('2024-01-15'),
    contractType: 'Unit Rate',
    contractStartDate: new Date('2024-02-01'),
    contractEndDate: new Date('2025-07-31'),
    contractAmount: 450000000,
    vatIncluded: true,
    status: 'Active',
  },
  {
    employeeName: 'Nepal Infrastructure Development Corp.',
    companyEmail: 'projects@nidc.com.np',
    employerOfficeName: 'Ministry of Physical Infrastructure, Lalitpur',
    employerEmail: 'mopi@gov.np',
    contractNumber: 'CTR-2024-002',
    contractTitle: 'Bagmati River Corridor Development Project',
    workDescription: 'Riverbank protection and beautification along 8km stretch',
    contractDate: new Date('2024-03-10'),
    contractType: 'Lump Sum',
    contractStartDate: new Date('2024-04-01'),
    contractEndDate: new Date('2025-03-31'),
    contractAmount: 280000000,
    vatIncluded: false,
    status: 'Active',
  },
  {
    employeeName: 'Everest Engineering Solutions',
    companyEmail: 'contact@everesteng.com.np',
    employerOfficeName: 'Kathmandu Metropolitan City Office',
    employerEmail: 'kmco@kathmandu.gov.np',
    contractNumber: 'CTR-2023-015',
    contractTitle: 'Smart City Infrastructure Phase II',
    workDescription: 'Installation of smart traffic management and surveillance systems',
    contractDate: new Date('2023-06-20'),
    contractType: 'Bepiyani',
    contractStartDate: new Date('2023-07-01'),
    contractEndDate: new Date('2024-06-30'),
    contractAmount: 125000000,
    vatIncluded: true,
    status: 'Completed',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Tender.deleteMany({});
    await BankGuarantee.deleteMany({});
    console.log('Cleared existing data');

    // Insert tenders
    const createdTenders = await Tender.insertMany(tenders);
    console.log(`Created ${createdTenders.length} tenders`);

    // Insert bank guarantees
    const guarantees = [
      {
        tenderId: createdTenders[0]._id,
        bankName: 'Nepal Bank Limited',
        guaranteeType: 'Performance Guarantee',
        guaranteeNumber: 'BG-NBL-2024-001',
        guaranteeAmount: 22500000,
        issuedDate: new Date('2024-02-01'),
        expiryDate: new Date('2025-08-31'),
        status: 'Active',
      },
      {
        tenderId: createdTenders[0]._id,
        bankName: 'Rastriya Banijya Bank',
        guaranteeType: 'Advance Guarantee',
        guaranteeNumber: 'BG-RBB-2024-002',
        guaranteeAmount: 45000000,
        issuedDate: new Date('2024-02-15'),
        expiryDate: new Date('2024-08-15'),
        status: 'Active',
      },
      {
        tenderId: createdTenders[0]._id,
        bankName: 'Nabil Bank',
        guaranteeType: 'Bid Bond',
        guaranteeNumber: 'BG-NABIL-2024-003',
        guaranteeAmount: 4500000,
        issuedDate: new Date('2023-12-01'),
        expiryDate: new Date('2024-03-01'),
        status: 'Released',
      },
      {
        tenderId: createdTenders[1]._id,
        bankName: 'Everest Bank Limited',
        guaranteeType: 'Performance Guarantee',
        guaranteeNumber: 'BG-EBL-2024-010',
        guaranteeAmount: 14000000,
        issuedDate: new Date('2024-04-01'),
        expiryDate: new Date('2025-04-30'),
        status: 'Active',
      },
      {
        tenderId: createdTenders[1]._id,
        bankName: 'NIC Asia Bank',
        guaranteeType: 'Advance Guarantee',
        guaranteeNumber: 'BG-NIC-2024-011',
        guaranteeAmount: 28000000,
        issuedDate: new Date('2024-04-15'),
        expiryDate: new Date('2024-10-15'),
        status: 'Active',
      },
      {
        tenderId: createdTenders[2]._id,
        bankName: 'Standard Chartered Bank Nepal',
        guaranteeType: 'Warranty Guarantee',
        guaranteeNumber: 'BG-SCB-2023-020',
        guaranteeAmount: 6250000,
        issuedDate: new Date('2024-07-01'),
        expiryDate: new Date('2025-06-30'),
        status: 'Active',
      },
    ];

    const createdGuarantees = await BankGuarantee.insertMany(guarantees);
    console.log(`Created ${createdGuarantees.length} bank guarantees`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\nSample data:');
    createdTenders.forEach((t) => {
      console.log(`  - ${t.contractNumber}: ${t.contractTitle}`);
    });
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
