const express = require('express');
const { isLoggedIn, protect } = require('../controllers/authController');

const {
	getOverview,
	getTour,
	getLogin,
	getAccount,
} = require('../controllers/viewController');

const router = express.Router();

router.get('/', isLoggedIn, getOverview);
router.get('/tours/:slug', isLoggedIn, getTour);
router.route('/login').get(isLoggedIn, getLogin);
router.get('/me', protect, getAccount);

module.exports = router;
