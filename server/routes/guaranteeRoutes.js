const express = require('express');
const router = express.Router();
const {
  getGuaranteesByTender,
  getGuarantee,
  createGuarantee,
  updateGuarantee,
  deleteGuarantee,
  getExpiringGuarantees,
} = require('../controllers/guaranteeController');

router.get('/expiring', getExpiringGuarantees);
router.get('/tender/:tenderId', getGuaranteesByTender);
router.route('/').post(createGuarantee);
router.route('/:id').get(getGuarantee).put(updateGuarantee).delete(deleteGuarantee);

module.exports = router;
