const mongoDriver = require('../MongoDriver');
const logger = require('../logger');
const MAX_RESPONSE_LIMIT = 5;
const { SUBMISSIONS_DB, CHANNELS_DB } = require('../config.json');
const SUBMISSIONTYPE = { LINK: 'link', ATTATCHMENT: 'attatchment' };
const RESPONSETYPE = { MESSAGE: 'message', EMBED: 'embed' };

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
		// If the channel is an allowed submissions
		const keyWords = message.content.toUpperCase().split(' ');
		if (keyWords[0] == '!SUBMIT') {
			if (_channel.isSubmissionChannel) {
				let responseLink = GetLink(message.content);
				let submissionType = '';
				if (responseLink == '' && message.attachments.size != 1) {
					message.reply('Invalid submission format.\nPlease use the following format: `!submit <key> <URL or attatchment>`\nOnly send a single URL or attatchment in your submission');
				}
				else {
					// Define what type of submission is being given: a web link or an attatchment
					if (responseLink != '') {
						submissionType = SUBMISSIONTYPE.LINK;
					}
					// If the message does not contain a URL link, and does include an attatchment
					else if (message.attachments.size == 1) {
						submissionType = SUBMISSIONTYPE.ATTATCHMENT;
						// Assign the response link to the discord link of the message attatchment
						responseLink = message.attachments.get(message.attachments.firstKey()).url;
					}
					// Query the DB to see if the submission key already exists
					mongoDriver.GetOneDocument({ key:keyWords[1] }, SUBMISSIONS_DB).then(
						function(result) {
							let duplicatekey = false;
							if (result != null) duplicatekey = true;
							// In order to have the ability for multiple responses per key, we have to make sure we are adding the responses as an array type
							const argsArray = [];
							argsArray[0] = responseLink;
							try {
								if (!duplicatekey) {
									mongoDriver.AddDocument({
										key: keyWords[1],
										cmdType: RESPONSETYPE.MESSAGE,
										args: argsArray,
									}, SUBMISSIONS_DB).then(console.log('Adding response for new key: ' + keyWords[1]));
								}
								else {
									mongoDriver.UpdateOneDocument(
										{ key: keyWords[1] },
										{ $push: { args:argsArray[0] } },
										SUBMISSIONS_DB).then(console.log('Adding new response for existing key: ' + keyWords[1]));
								}
								message.channel.send({ embeds: [{
									title: 'Submission Added',
									description: BuildSubmission(message, keyWords[1], responseLink, submissionType),
									footer: {
										text: 'This has been added to my database, and can be used right away!',
									},
								}] },
								);
							}
							catch (err) {
								message.channel.send('Sorry! The submission system ran into a problem.');
								console.error(err);
							}
						});
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
				// Check the db for a document with the key word
				responseCount++;
				mongoDriver.GetOneDocument({ key:keyWords[i] }, SUBMISSIONS_DB).then(
					function(results) {
						// If no results were returned, exit
						if (results == null) return;
						// increment response count
						// initialize index to 0. documents with only 1 response will be at args[0]
						let index = 0;
						// If there is more than one entry for this key, pick one at random, and change index
						if (results.submissions.length > 1) index = Math.floor(Math.random() * results.submissions.length);
						logger.log(`Response found for ${keyWords[i]}`);
						message.channel.send(results.submissions[index].response);
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
function BuildSubmission(originalMessage, _messageKey, _messageLink, _submissionType) {
	// Build the shared parts of the submission text
	let submissionString = 'Key: ' + _messageKey + '\n';

	if (_submissionType == SUBMISSIONTYPE.LINK) {
		submissionString += 'URL: ' + _messageLink + '\n';
	}
	if (_submissionType == SUBMISSIONTYPE.ATTATCHMENT) {
		submissionString += 'Attatchment: ' + _messageLink + '\n';
	}
	return submissionString;
}