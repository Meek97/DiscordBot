const { MessagePayload } = require('discord.js');
const logger = require('../logger');
const bot = require('../memebot');
const mongooseDriver = require('../mongooseDriver');

module.exports = {
	name: 'line',
	once: false,
	execute(input) {
		const inputParts = input.split(' ');
		if(inputParts.length > 3) {
			while(inputParts.length > 3) {
				inputParts[2] += ` ${inputParts[3]}`;
				const removed = inputParts.splice(3,1)
			}
		}
		logger.log(`Console Input Received: [${input}]`);
		if(inputParts[0] == '/say'){
				mongooseDriver.Channels.find({'name':inputParts[1]})
					.then(function(channelResults) {
						if(channelResults.length > 0){
							bot.GetChannel(channelResults[0]._id)
								.then((channel) => {
									bot.SendMessage(new MessagePayload(channel,
										{content:inputParts[2]}));
								});
						}
					});
		}
		if(inputParts[0] == '/morning'){
			bot.SendGoodMorning();
		}
	},
};