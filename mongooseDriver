const mongoose = require('mongoose');
const { DB_URI, DB_NAME } = require('./config.json');
const logger = require('./logger');

module.exports = {

	Channels : require('./models/channel'),
	Responses : require('./models/response'),
	Submissions : require('./models/response'),
	mongooseClient : null,
	Init: async function() {
		if (!this.mongoClient) {
			logger.log('no mongoose client created. creating new client now');
			this.mongooseClient = await mongoose.connect(`${DB_URI}/${DB_NAME}`);
		}
		else {
			logger.log(`Mongoose client already connected on ${this.mongooseClient.connection._connectionString}`);
		}
	},
}