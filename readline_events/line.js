const mongoDriver = require('../MongoDriver');
const logger = require('../logger');
const weather = require('../weather');
const bot = require('../memebot');
const { SUBMISSIONS_DB, CHANNELS_DB } = require('../config.json');
const { MessagePayload, MessageEmbed, AttachmentBuilder, MessageAttachment } = require('discord.js');

module.exports = {
	name: 'line',
	once: false,
	execute(input) {
		logger.log(`Received: ${input}`);
		if(input == 'weather'){
				
		}
		if(input == 'morning'){
			bot.SendGoodMorning();
		}
	},
};