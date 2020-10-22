const express = require('express');
const { isLoggedIn, protect } = require('../controllers/authController');
// const { createBookingCheckout } = require('../controllers/bookingController');

const {
	getOverview,
	getTour,
	getLogin,
	getAccount,
	getMytours,
} = require('../controllers/viewController');

const router = express.Router();

router.get('/', /* createBookingCheckout */ isLoggedIn, getOverview);
router.get('/tours/:slug', isLoggedIn, getTour);
router.route('/login').get(isLoggedIn, getLogin);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMytours);

module.exports = router;
