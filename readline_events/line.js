const logger = require('../logger');
const bot = require('../memebot');

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