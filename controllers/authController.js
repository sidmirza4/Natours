const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};

const createSendToken = (user, statusCode, res) => {
	const token = signToken(user._id);

	const cookiOptions = {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
	};

	if (process.env.NODE_ENV === 'production') cookiOptions.secure = true;

	res.cookie('jwt', token, cookiOptions);

	// REMOVE THE PASSWORD FROM THE OUTPUT
	user.password = undefined;

	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user,
		},
	});
};

exports.signup = catchAsync(async (req, res, next) => {
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
		passwordChangedAt: req.body.passwordChangedAt,
		role: req.body.role,
	});

	createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	// 1) Check email and password exist
	if (!email || !password) {
		return next(new AppError(`Please provide email and password`, 400));
	}

	// 2) Check if user exists && password is correct
	const user = await User.findOne({ email }).select('+password');

	if (!user || !(await user.correctPassword(password, user.password))) {
		return next(new AppError('Incorrect email or password', 401));
	}

	// 3) If everything is ok, senfd the token to the client
	createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
	res.cookie('jwt', 'logged-out', {
		expires: new Date(Date.now() + 10000),
		httpOnly: true,
	});
	res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
	// 1)  Getting the token and check if it's there

	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	} else if (req.cookies.jwt) {
		token = req.cookies.jwt;
	}

	if (!token) {
		return next(
			new AppError('You have to be logged in to get access', 401)
		);
	}

	// 2) varification of token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

	// 3) check if user still exist
	const currentUser = await User.findById(decoded.id);
	if (!currentUser) {
		return next(
			new AppError(
				'The user to this token was issued for does not exist anymore',
				401
			)
		);
	}

	// 4) check if user changed password after the token was issued
	if (currentUser.changedPasswordAfter(decoded.iat)) {
		return next(
			new AppError(
				'User recently changed password, please login again',
				401
			)
		);
	}

	//  GRANT ACCESS TO PROTECTED ROUTE
	req.user = currentUser;
	next();
});

// only for rendered pages , and there will be no errors if the user is not logged in.
exports.isLoggedIn = async (req, res, next) => {
	// 1)  Getting the token and check if it's there

	if (req.cookies.jwt) {
		try {
			// 2) varification of token
			const decoded = await promisify(jwt.verify)(
				req.cookies.jwt,
				process.env.JWT_SECRET
			);

			// 3) check if user still exist
			const currentUser = await User.findById(decoded.id);
			if (!currentUser) {
				return next();
			}

			// 4) check if user changed password after the token was issued
			if (currentUser.changedPasswordAfter(decoded.iat)) {
				return next();
			}

			//  there is a logged in user
			res.locals.user = currentUser;
			return next();
		} catch (err) {
			return next();
		}
	}
	next();
};

// the rest operator (...) will convert all the arguments into an array
exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		// roles is an array: ['admin', 'lead-admin'], role='user'
		if (!roles.includes(req.user.role)) {
			return next(
				new AppError('you do not have permission to do that', 403)
			);
		}

		next();
	};
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
	// Get user based on posted email
	const user = await User.findOne({ email: req.body.email });

	if (!user)
		next(new AppError('no user exists with that email address', 404));

	//  generate a random token
	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });

	// send it back to user's email
	const resetURL = `${req.protocol}://${req.get(
		'host'
	)}/api/v1/users/resetPassword/${resetToken}`;

	const message = `Forgot your password? Submit a PATCH request with your new password and password confirmation to ${resetURL}.\nIf you did not forget your password please ignore this email.`;

	try {
		await sendEmail({
			email: user.email,
			subject: 'Password reset request, token is valid for 10 miniutes.',
			message,
		});

		res.status(200).json({
			status: 'success',
			message: 'Token sent to the email',
		});
	} catch (err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });

		return next(
			new AppError(
				'There was an error sending the email. Try again after some time.',
				500
			)
		);
	}
});

exports.resetPassword = catchAsync(async (req, res, next) => {
	// get user based on the token
	const hashedToken = crypto
		.createHash('sha256')
		.update(req.params.token)
		.digest('hex');

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() },
	});

	// set the new password if token has not expired and there is a user
	if (!user) {
		return next(new AppError('Your taken is invalid or has expired', 400));
	}

	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save();

	// update changePasswordAt property for the current user

	// log the user in
	createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
	// get user from the collection
	const user = await User.findById(req.user.id).select('+password');
	if (!user) {
		return next(new AppError('you have to be logged in to do that'));
	}

	// check if current password is correct
	const isPasswordCorrect = await user.correctPassword(
		req.body.passwordCurrent,
		user.password
	);

	if (!isPasswordCorrect) {
		return next(new AppError('please enter correct current password', 401));
	}

	// if the password is correct, update the password
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	await user.save();

	// log the user in
	createSendToken(user, 200, res);
});
