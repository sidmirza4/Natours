const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
	constructor(user, url) {
		this.to = user.email;
		this.firstName = user.name.split(' ')[0];
		this.url = url;
		this.from = `Mohd Shahid <${process.env.EMAIL_FROM}>`;
	}

	newTransport() {
		if (process.env.NODE_ENV === 'production') {
			// Sendgrid
			return 1;
		}

		return nodemailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: process.env.EMAIL_PORT,
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD,
			},
		});
	}

	// send the actual email
	async send(template, subject) {
		// render html based on pug template
		const html = pug.renderFile(
			`${__dirname}/../views/email/${template}.pug`,
			{
				firstName: this.firstName,
				url: this.url,
				subject,
			}
		);

		// define the email options
		const mailOptions = {
			from: this.from,
			to: this.to,
			subject,
			html,
			text: htmlToText.fromString(html),
		};

		// create a transport and send email
		await this.newTransport().sendMail(mailOptions);
	}

	async sendWelcome() {
		await this.send('welcome', 'Welcome to the Natours Family');
	}

	async sendPasswordReset() {
		await this.send(
			'passwordReset',
			'You password reset token (valid for only 10 minutes)'
		);
	}
};
