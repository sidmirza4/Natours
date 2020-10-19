const express = require('express');
const { protect } = require('../controllers/authController');

const {
	getOverview,
	getTour,
	getLogin,
} = require('../controllers/viewController');

const router = express.Router();

router.get('/', getOverview);
router.route('/login').get(getLogin);
router.get('/tours/:slug', protect, getTour);

module.exports = router;
