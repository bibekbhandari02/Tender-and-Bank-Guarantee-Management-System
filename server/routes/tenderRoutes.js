const express = require('express');
const router = express.Router();
const {
  getTenders,
  getTender,
  createTender,
  updateTender,
  deleteTender,
} = require('../controllers/tenderController');

router.route('/').get(getTenders).post(createTender);
router.route('/:id').get(getTender).put(updateTender).delete(deleteTender);

module.exports = router;
