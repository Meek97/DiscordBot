const mongoose = require('mongoose');
const { DB_URI, DB_NAME } = require('./config.json');
const logger = require('./logger');

module.exports = {

	Channels : require('./models/channel'),
	Responses : require('./models/response'),
	Submissions : require('./models/submission'),
	mongooseClient : null,
	Init: async function() {
		if (!this.mongoClient) {
            this.mongooseClient = await mongoose.connect(`${DB_URI}/${DB_NAME}`);
			logger.log(`New mongoose connection started at: ${this.mongooseClient.connection._connectionString}`);
		}
		else {
			logger.log(`Mongoose client already connected on ${this.mongooseClient.connection._connectionString}`);
		}
	},
}