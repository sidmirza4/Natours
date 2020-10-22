const mongoose = require('mongoose');

const { Schema } = mongoose;

const Tour = require('./tourModel');

const reviewSchema = new Schema(
	{
		review: {
			type: String,
			required: [true, 'Review cannot be empty'],
		},

		rating: {
			type: Number,
			required: [true, ' A review must have a rating '],
			min: 1,
			max: 5,
		},

		createdAt: { type: Date, default: Date.now() },

		tour: {
			type: mongoose.Schema.ObjectId,
			ref: 'Tour',
			required: [true, 'Review must belong to a tour'],
		},

		user: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: [true, 'A review must belong to a user'],
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// populating user and tour
reviewSchema.pre(/^find/, function(next) {
	// this.populate({
	// 	path: 'tour',
	// 	select: 'name',
	// }).populate({
	// 	path: 'user',
	// 	select: 'name photo',
	// });

	this.populate({
		path: 'user',
		select: 'name photo',
	});

	next();
});

// static method
reviewSchema.statics.calcAverageRatings = async function(tourId) {
	// in static method this keyword points to the model but not to the document
	const stats = await this.aggregate([
		{
			$match: { tour: tourId },
		},
		{
			$group: {
				_id: '$tour',
				nRating: { $sum: 1 },
				avgRating: { $avg: '$rating' },
			},
		},
	]);

	if (stats.length > 0) {
		await Tour.findByIdAndUpdate(tourId, {
			ratingsQuantity: stats[0].nRating,
			ratingsAverage: stats[0].avgRating,
		});
	} else {
		await Tour.findByIdAndUpdate(tourId, {
			ratingsQuantity: 0,
			ratingsAverage: 4.5,
		});
	}
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.post('save', function() {
	// this keyword points to current document
	// this.constructor points to the constructor which created the current document

	this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
	// in query middleware this keyword points to the current query ( but not document )

	this.r = await this.findOne();
	// passing r variable by attaching it to this keyword to the post middlware to
	// call calcAverageRatings , because in post middleware we do not have access to
	// the document , because it has already been saved/updated
	next();
});

reviewSchema.post(/^findOneAnd/, async function() {
	// await this.findOne() will not work here because the query has already been executed
	await this.r.constructor.calcAverageRatings(this.r.tour);
});

module.exports = mongoose.model('Review', reviewSchema);
