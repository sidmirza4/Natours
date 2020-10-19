const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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

exports.getLogin = (req, res, next) => {
	res.status(200).render('login', { title: 'Login' });
};
