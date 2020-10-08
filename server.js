const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
	console.log(err.name, err.message);
	console.log('UNHANDLED EXCEPTION, SHUTTING DOWN');
	process.exit(1);
});

const app = require('./app');

const DB = process.env.DATABASE_LOCAL;

mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
		useUnifiedTopology: true,
	})
	.then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
	console.log(`App running on port ${port}...`);
});

// EVENT AND EVENT LISTENER
process.on('unhandledRejection', (err) => {
	console.log(err.name, err.message);
	console.log('UNHANDLED REJECTION, SHUTTING DOWN');
	server.close(() => {
		process.exit(1);
	});
});

process.on('uncaughtException', (err) => {
	console.log(err.name, err.message);
	console.log('UNHANDLED EXCEPTION, SHUTTING DOWN');
	server.close(() => {
		process.exit(1);
	});
});
