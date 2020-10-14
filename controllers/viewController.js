const Tour = require('../models/tourModel');
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

exports.getTour = (req, res) => {
	res.status(200).render('tour', {
		title: 'The Forest Hiker',
	});
};
