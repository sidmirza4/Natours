const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please tell us your name'],
		trim: true,
	},

	email: {
		type: String,
		required: [true, 'Please provide your email address'],
		trim: true,
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, 'Please provide a valid email'],
	},

	photo: String,

	role: {
		type: String,
		enum: ['user', 'guide', 'lead-guide', 'admin'],
		default: 'user',
	},

	password: {
		type: String,
		required: [true, 'Please provide a password'],
		trim: true,
		minlength: 8,
		select: false,
	},

	passwordConfirm: {
		type: String,
		required: [true, 'Please confirm your password'],
		trim: true,
		validate: {
			//  this only works on SAVE!!!
			validator: function(el) {
				return el === this.password;
			},
			message: 'Passwords are not the same',
		},
	},

	passwordChangedAt: Date,

	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false,
	},
});

userSchema.pre('save', function(next) {
	if (!this.isModified('password') || this.isNew) return next();

	// practically saving documents takes a bit more time than issuing new jwt
	this.passwordChangedAt = Date.now() - 1000;
	next();
});

userSchema.pre('save', async function(next) {
	// only run this function if the password was actually modified
	if (!this.isModified('password')) return next();

	// hash the password with cost of 12
	this.password = await bcrypt.hash(this.password, 12);

	//  Delete passwordConfirm Field
	this.passwordConfirm = undefined;
	next();
});

userSchema.pre(/^find/, function(next) {
	this.find({ active: { $ne: false } });
	next();
});

userSchema.methods.correctPassword = async function(
	candidatePassword,
	userPassword
) {
	return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
	if (this.passwordChangedAt) {
		const changedTimeStamp = parseInt(
			this.passwordChangedAt.getTime() / 1000,
			10
		);
		return JWTTimestamp < changedTimeStamp;
	}

	//  FALSE MEANS THAT THE PASSWORD IS NOT CHANGED
	return false;
};

userSchema.methods.createPasswordResetToken = function() {
	const resetToken = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

	return resetToken;
};

module.exports = mongoose.model('User', userSchema);
