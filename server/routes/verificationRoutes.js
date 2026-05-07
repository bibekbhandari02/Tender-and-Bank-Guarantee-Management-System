const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getVerificationGuarantees } = require('../controllers/verificationController');

router.use(protect);
router.get('/guarantees', getVerificationGuarantees);

module.exports = router;
