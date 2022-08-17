const mongoDriver = require('../MongoDriver');
const logger = require('../logger');
const { guildId, CHANNELS_DB } = require('../config.json');
module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		logger.log(`Ready! Logged in as ${client.user.tag}`);
		const Guild = await client.guilds.fetch(guildId);
		const Channels = Guild.channels;
		Channels.fetch()
			.then(function(channels) {
				logger.log(`found ${channels.size} channels`);
				channels.forEach(channel => {
					if (channel.type == 'GUILD_TEXT') {
						// Define a default channel object for the DB
						const dbObject = {
							'_id' : channel.id,
							'name' : channel.name,
							'guild' : channel.guildId,
							'guildName' : channel.guild.name,
							'isResponseChannel' : false,
							'isSubmissionChannel' : false,
							'isPaused' : false,
							'isGMG' : false,
						};
						// Check if a document already exists in the DB under the same id
						mongoDriver.GetOneDocument({ _id : dbObject._id }, CHANNELS_DB).then(
							function(results) {
								// If no results were returned
								if (results == null) {
									logger.log(`${channel.name} | ${channel.id} does not yet exists in ChannelsDB. Adding entry now`);
									// Add default channel object to the DB
									mongoDriver.AddDocument(dbObject, CHANNELS_DB);
								}
								// If a result was found
								else {
									// check that the existing document has all of the same properties as the default object
									for (const property in dbObject) {
										// if a field is found to be missing, update the document
										if (results[property] == undefined) {
											logger.log(`${channel.name} | ${channel.id} missing ${property} property. Updating now`);
											mongoDriver.UpdateOneDocument(
												{ _id : dbObject._id },
												{ $set: { [property] : dbObject[property] } },
												CHANNELS_DB);
										}
										// TODO : remove properties from document that aren't present in the default object?
									}
								}
							});
					}
				});
			});
	},
};