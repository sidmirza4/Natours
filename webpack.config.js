const path = require('path');

module.exports = {
	mode: 'development',
	entry: './public/js/index.js',
	output: {
		path: path.resolve(__dirname, 'public'),
		filename: 'js/bundle.js',
	},
	devtool: 'cheap-module-source-map',
};
