/**
 * Seed script — creates user shreyaconstruction2075@gmail.com with 5 tenders + guarantees
 * Run: node server/seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Tender = require('./models/Tender');
const BankGuarantee = require('./models/BankGuarantee');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ── Create / find user ───────────────────────────────────────
    let user = await User.findOne({ email: 'shreyaconstruction2075@gmail.com' });
    if (user) {
      console.log('ℹ️  User already exists, reusing:', user.email);
    } else {
      user = await User.create({
        name: 'Shreya Construction',
        email: 'shreyaconstruction2075@gmail.com',
        password: 'shreya2075',
        companyName: 'Shreya Construction Pvt. Ltd.',
      });
      console.log('👤 Created user:', user.email);
    }

    // ── Clear existing data for this user ────────────────────────
    const existingTenders = await Tender.find({ userId: user._id });
    const tenderIds = existingTenders.map((t) => t._id);
    await BankGuarantee.deleteMany({ tenderId: { $in: tenderIds } });
    await Tender.deleteMany({ userId: user._id });
    console.log('🗑️  Cleared existing tenders & guarantees for this user');

    // ── Seed 5 tenders ───────────────────────────────────────────
    const tenderData = [
      {
        employeeName: 'Shreya Construction Pvt. Ltd.',
        companyEmail: 'shreyaconstruction2075@gmail.com',
        employerOfficeName: 'Department of Roads, Kathmandu',
        employerEmail: 'dor@gov.np',
        contractNumber: 'SC-2081-001',
        contractTitle: 'Construction of Kathmandu Ring Road Extension',
        workDescription: 'Construction of 12km ring road extension including bridges and drainage systems',
        contractDate: new Date('2024-04-14'),
        contractType: 'Unit Rate',
        contractStartDate: new Date('2024-05-01'),
        contractEndDate: new Date('2025-10-31'),
        contractAmount: 450000000,
        vatIncluded: true,
        status: 'Active',
        userId: user._id,
      },
      {
        employeeName: 'Shreya Construction Pvt. Ltd.',
        companyEmail: 'shreyaconstruction2075@gmail.com',
        employerOfficeName: 'Bagmati Province Government, Hetauda',
        employerEmail: 'bagmati@province.gov.np',
        contractNumber: 'SC-2081-002',
        contractTitle: 'Bagmati River Corridor Development Project',
        workDescription: 'Riverbank protection and beautification along 8km stretch of Bagmati River',
        contractDate: new Date('2024-06-20'),
        contractType: 'Lump Sum',
        contractStartDate: new Date('2024-07-01'),
        contractEndDate: new Date('2025-06-30'),
        contractAmount: 280000000,
        vatIncluded: false,
        status: 'Active',
        userId: user._id,
      },
      {
        employeeName: 'Shreya Construction Pvt. Ltd.',
        companyEmail: 'shreyaconstruction2075@gmail.com',
        employerOfficeName: 'Kathmandu Metropolitan City Office',
        employerEmail: 'kmco@kathmandu.gov.np',
        contractNumber: 'SC-2080-015',
        contractTitle: 'Smart City Infrastructure Phase II',
        workDescription: 'Installation of smart traffic management and surveillance systems across 15 intersections',
        contractDate: new Date('2023-07-15'),
        contractType: 'Bepiyani',
        contractStartDate: new Date('2023-08-01'),
        contractEndDate: new Date('2024-07-31'),
        contractAmount: 125000000,
        vatIncluded: true,
        status: 'Completed',
        userId: user._id,
      },
      {
        employeeName: 'Shreya Construction Pvt. Ltd.',
        companyEmail: 'shreyaconstruction2075@gmail.com',
        employerOfficeName: 'Nepal Electricity Authority, Butwal',
        employerEmail: 'nea.butwal@nea.org.np',
        contractNumber: 'SC-2081-003',
        contractTitle: 'Rural Electrification Project — Palpa District',
        workDescription: 'Extension of electricity grid to 12 VDCs in Palpa district covering 3,200 households',
        contractDate: new Date('2024-08-10'),
        contractType: 'Unit Rate',
        contractStartDate: new Date('2024-09-01'),
        contractEndDate: new Date('2026-02-28'),
        contractAmount: 185000000,
        vatIncluded: true,
        status: 'Active',
        userId: user._id,
      },
      {
        employeeName: 'Shreya Construction Pvt. Ltd.',
        companyEmail: 'shreyaconstruction2075@gmail.com',
        employerOfficeName: 'Pokhara Metropolitan City',
        employerEmail: 'pmc@pokhara.gov.np',
        contractNumber: 'SC-2080-008',
        contractTitle: 'Pokhara Lakeside Promenade Renovation',
        workDescription: 'Renovation and beautification of 3.5km lakeside promenade including lighting and landscaping',
        contractDate: new Date('2023-03-05'),
        contractType: 'Lump Sum',
        contractStartDate: new Date('2023-04-01'),
        contractEndDate: new Date('2024-03-31'),
        contractAmount: 95000000,
        vatIncluded: false,
        status: 'Completed',
        userId: user._id,
      },
    ];

    const tenders = await Tender.insertMany(tenderData);
    console.log(`📄 Created ${tenders.length} tenders`);

    // ── Seed guarantees ──────────────────────────────────────────
    const guaranteeData = [
      // Tender 1 — Ring Road
      { tenderId: tenders[0]._id, userId: user._id, bankName: 'Nepal Bank Limited', guaranteeType: 'Performance Guarantee', guaranteeNumber: 'BG-NBL-2081-001', guaranteeAmount: 22500000, issuedDate: new Date('2024-05-01'), expiryDate: new Date('2025-11-30'), status: 'Active' },
      { tenderId: tenders[0]._id, userId: user._id, bankName: 'Rastriya Banijya Bank', guaranteeType: 'Advance Guarantee', guaranteeNumber: 'BG-RBB-2081-002', guaranteeAmount: 45000000, issuedDate: new Date('2024-05-15'), expiryDate: new Date('2024-11-15'), status: 'Active' },
      { tenderId: tenders[0]._id, userId: user._id, bankName: 'Nabil Bank', guaranteeType: 'Bid Bond', guaranteeNumber: 'BG-NABIL-2081-003', guaranteeAmount: 4500000, issuedDate: new Date('2024-02-01'), expiryDate: new Date('2024-05-01'), status: 'Released' },

      // Tender 2 — Bagmati
      { tenderId: tenders[1]._id, userId: user._id, bankName: 'Everest Bank Limited', guaranteeType: 'Performance Guarantee', guaranteeNumber: 'BG-EBL-2081-010', guaranteeAmount: 14000000, issuedDate: new Date('2024-07-01'), expiryDate: new Date('2025-07-31'), status: 'Active' },
      { tenderId: tenders[1]._id, userId: user._id, bankName: 'NIC Asia Bank', guaranteeType: 'Advance Guarantee', guaranteeNumber: 'BG-NIC-2081-011', guaranteeAmount: 28000000, issuedDate: new Date('2024-07-15'), expiryDate: new Date('2025-01-15'), status: 'Active' },

      // Tender 3 — Smart City (completed)
      { tenderId: tenders[2]._id, userId: user._id, bankName: 'Standard Chartered Bank Nepal', guaranteeType: 'Warranty Guarantee', guaranteeNumber: 'BG-SCB-2080-020', guaranteeAmount: 6250000, issuedDate: new Date('2024-08-01'), expiryDate: new Date('2025-07-31'), status: 'Active' },

      // Tender 4 — Rural Electrification
      { tenderId: tenders[3]._id, userId: user._id, bankName: 'Himalayan Bank Limited', guaranteeType: 'Performance Guarantee', guaranteeNumber: 'BG-HBL-2081-015', guaranteeAmount: 9250000, issuedDate: new Date('2024-09-01'), expiryDate: new Date('2026-03-31'), status: 'Active' },
      { tenderId: tenders[3]._id, userId: user._id, bankName: 'Kumari Bank', guaranteeType: 'Advance Guarantee', guaranteeNumber: 'BG-KBL-2081-016', guaranteeAmount: 18500000, issuedDate: new Date('2024-09-15'), expiryDate: new Date('2025-03-15'), status: 'Active' },

      // Tender 5 — Pokhara (completed)
      { tenderId: tenders[4]._id, userId: user._id, bankName: 'Machhapuchchhre Bank', guaranteeType: 'Performance Guarantee', guaranteeNumber: 'BG-MBL-2080-008', guaranteeAmount: 4750000, issuedDate: new Date('2023-04-01'), expiryDate: new Date('2024-04-30'), status: 'Released' },
    ];

    const guarantees = await BankGuarantee.insertMany(guaranteeData);
    console.log(`🏦 Created ${guarantees.length} bank guarantees`);

    console.log('\n✅ Seed completed!');
    console.log('\n📋 Login credentials:');
    console.log('   Email   :', 'shreyaconstruction2075@gmail.com');
    console.log('   Password:', 'shreya2075');
    console.log('\n📄 Tenders created:');
    tenders.forEach((t) => console.log(`   - ${t.contractNumber}: ${t.contractTitle} [${t.status}]`));
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
