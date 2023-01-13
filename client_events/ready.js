const mongooseDriver = require('../mongooseDriver');
const logger = require('../logger');
const { guildId, CHANNELS_DB } = require('../config.json');
module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		let Guild;
		try {
			Guild = await client.guilds.fetch(guildId);
		} catch (error) {
			if(error.code == 50001) { // Missing Access Error. Bot does not have access to the given guild ID
				logger.log(`${error.name} | ${error.message} error. Bot does not have access to guildID: ${guildId}`);
				return error;
			}
			
		}
		
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
						mongooseDriver.Channels.findOne({_id:dbObject._id})
							.then(function(results) {
								// If no results were returned
								if (results == null) {
									logger.log(`${channel.name} | ${channel.id} does not yet exists in ChannelsDB. Adding entry now`);
									// Add default channel object to the DB
									mongooseDriver.Channels.create(dbObject);
									// mongoDriver.AddDocument(dbObject, CHANNELS_DB);
								}
								// If a result was found
								else {
									// check that the existing document has all of the same properties as the default object
									for (const property in dbObject) {
										// if a field is found to be missing, update the document
										if (results[property] == undefined) {
											logger.log(`${channel.name} | ${channel.id} missing ${property} property. Updating now`);
											
											mongooseDriver.Channels.updateOne({ _id : dbObject._id },{ $set: { [property] : dbObject[property] } })
										}
									}
									results.save();
								}
							});
					}
				});
			});

		logger.log(`Ready! Logged in as ${client.user.tag}`);
	},
};