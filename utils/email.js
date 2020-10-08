const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
	// Create a transporter
	const transporter = nodemailer.createTransport({
		host: 'smtp.mailtrap.io',
		port: 2525,
		auth: {
			user: '835b30dd139987',
			pass: '8ffc8d32eee5a5',
		},
	});

	// define the email options
	const mailOptions = {
		from: 'Mohd Shahid <sidmirza4@gmail.com>',
		to: options.email,
		subject: options.subject,
		text: options.message,
	};

	// actually send the email with nodemailer
	await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
