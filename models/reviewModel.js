const mongoose = require('mongoose');

const { Schema } = mongoose;

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

module.exports = mongoose.model('Review', reviewSchema);
