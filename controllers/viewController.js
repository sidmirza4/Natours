const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.alerts = (req, res, next) => {
	const { alert } = req.query;
	if (alert === 'booking') {
		res.locals.alert =
			'Your booking was successful, please check your email.If your booking does not show up here immedietly, please check after some time.';
	}

	next();
};

exports.getOverview = catchAsync(async (req, res) => {
	// get all the tour data from collection
	const tours = await Tour.find();

	// build template

	// render the template using the tours data

	res.status(200).render('overview', {
		title: 'All Tours',
		tours,
	});
});

exports.getTour = catchAsync(async (req, res, next) => {
	// get the data for the requested route including reviews and tour-guides
	const { slug } = req.params;

	const tour = await Tour.findOne({ slug }).populate({
		path: 'reviews',
		fields: 'review rating user',
	});

	if (!tour) {
		return next(new AppError('Tour is not found', 404));
	}

	// render the template and pass the data

	res.status(200).render('tour', {
		title: tour.name,
		tour,
	});
});

exports.getMytours = catchAsync(async (req, res, next) => {
	// find all the bookings
	const bookings = await Booking.find({ user: req.user.id });

	// find tours with returned IDs
	const tourIDs = bookings.map((el) => el.tour);

	const tours = await Tour.find({ _id: { $in: tourIDs } });

	res.status(200).render('overview', { title: 'My Bookings', tours });
});

exports.getLogin = (req, res, next) => {
	res.status(200).render('login', { title: 'Login' });
};

exports.getAccount = (req, res) => {
	res.status(200).render('account', { title: 'Your Account' });
};
