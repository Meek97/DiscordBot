const mongoDriver = require('../MongoDriver');
const logger = require('../logger');
const MAX_RESPONSE_LIMIT = 5;
const { SUBMISSIONS_DB, CHANNELS_DB } = require('../config.json');

module.exports = {
	name: 'messageCreate',
	once: false,
	async execute(message) {
		// Exit if the message was sent from a BOT
		if (message.author.bot) return;
		// check if the bot knows about this channel
		const _channel = await mongoDriver.GetOneDocument({ _id : message.channelId }, CHANNELS_DB);
		// Exit if _channel returns empty
		if (!_channel) return;
		// exit if the channel is currently paused
		if (_channel.isPaused) return;

		const guild = await message.guild.fetch();
		const emojis = await guild.emojis.fetch();

		const keyWords = message.content.toUpperCase().split(' ');
		if (keyWords[0] == '!SUBMIT') {
			if (_channel.isSubmissionChannel) {
				let responseLink = GetLink(message.content);
				if (responseLink == '' && message.attachments.size != 1) {
					message.reply('Invalid submission format.\nPlease use the following format: `!submit <key> <URL or attatchment>`\nOnly send a single URL or attatchment in your submission');
				}
				else {
					// If the message does not contain a URL link, and does include an attatchment
					if (message.attachments.size == 1) {
						// Assign the response link to the discord link of the message attatchment
						responseLink = message.attachments.get(message.attachments.firstKey()).url;
					}
					// Query the DB to see if the submission key already exists
					mongoDriver.GetOneDocument({ key:keyWords[1] }, SUBMISSIONS_DB).then(result => SaveSubmission(result, responseLink, message, keyWords[1]));
				}
			}
			else {
				message.reply('submissions are not allowed in this channel');
			}
		}
		// If the channel is allowed resopnses
		if (_channel.isResponseChannel) {
			// save an array of the words in the message by splitting on space. also shift up for easier parsing
			let responseCount = 0;
			for (let i = 0; i < keyWords.length; i++) {
				if (keyWords[i].startsWith('!')) break;
				// if the maximum response limit has been reached, exit
				if (responseCount >= MAX_RESPONSE_LIMIT) break;
				// increment response count
				responseCount++;
				// Check the db for a document with the key word
				mongoDriver.GetOneDocument({ key:keyWords[i] }, SUBMISSIONS_DB).then(
					function(results) {
						// If no results were returned, exit
						if (results == null) return;
						
						let index = 0;
						if(results.react==true){
							if(results.reactions.length>1) index = Math.floor(Math.random()*results.reactions.length);
							message.react(`${results.reactions[index].emoji}`);
						}
						// reset index to 0. documents with only 1 response will be at args[0]
						if(results.submissions){
							// If there is more than one entry for this key, pick one at random, and change index
							if (results.submissions.length > 1) index = Math.floor(Math.random() * results.submissions.length);
							logger.log(`Response found for ${keyWords[i]}`);
							message.channel.send(results.submissions[index].response);
						}
					});
			}
		}
	},
};
function GetLink(_message) {
	const stringParts = _message.split(' ');
	let linkString = '';
	for (let i = 0;i < stringParts.length;i++) {
		if (stringParts[i].includes('http://') || stringParts[i].includes('https://')) {
			linkString = stringParts[i];
			break;
		}
	}
	return linkString;
}
async function SaveSubmission(result, link, message, key) {
	let duplicatekey = false;
	if (result != null) duplicatekey = true;
	// In order to have the ability for multiple responses per key, we have to make sure we are adding the responses as an array type
	const submissionObject = [];
	submissionObject[0] = { response: link, author: message.author.username };
	if (!duplicatekey) {
		logger.log(`Adding new document for ${key}`);
		await mongoDriver.AddDocument({
			key: key,
			submissions: submissionObject,
		}, SUBMISSIONS_DB).then(newDoc => newDoc);
	}
	else {
		logger.log(`Updating existing document for ${key}`);
		await mongoDriver.UpdateOneDocument(
			{ key: key },
			{ $push: { submissions:submissionObject[0] } },
			SUBMISSIONS_DB).then(newDoc => newDoc);
	}
	message.channel.send({ embeds: [{
		title: 'Submission Added',
		description: `Key: \`${key}\`\nAuthor: ${message.author.username}\nSubmission: ${link}`,
		footer: {
			text: 'This has been added to my database, and can be used right away!',
		},
	}] },
	);
}