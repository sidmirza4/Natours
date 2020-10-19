const express = require('express');
const { isLoggedIn } = require('../controllers/authController');

const {
	getOverview,
	getTour,
	getLogin,
} = require('../controllers/viewController');

const router = express.Router();

router.use(isLoggedIn);

router.get('/', getOverview);
router.route('/login').get(getLogin);
router.get('/tours/:slug', getTour);

module.exports = router;
