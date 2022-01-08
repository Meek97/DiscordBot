const { SlashCommandBuilder } = require('@discordjs/builders');
const mongoDriver = require('../MongoDriver');
const logger = require('../logger');
const { CHANNELS_DB } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('channel')
		.setDescription('Modify or view channel properties')
		.setDefaultPermission(false)
		.addSubcommand(_status =>
			_status
				.setName('status')
				.setDescription('View the properties of a channel or all channels')
				.addStringOption(option => option.setName('channel_name').setDescription('The name of the channel [blank for all channels]').setRequired(false)),
		)
		.addSubcommand(_responses =>
			_responses
				.setName('set_responses')
				.setDescription('Enable or Disable Responses for a channel')
				.addStringOption(option => option.setName('channel_name').setDescription('The name of the channel').setRequired(true))
				.addBooleanOption(option => option.setName('set_enabled').setDescription('[True / False]').setRequired(true)),
		)
		.addSubcommand(_submissions =>
			_submissions
				.setName('set_submissions')
				.setDescription('Enable or Disable Submissions for a channel')
				.addStringOption(option => option.setName('channel_name').setDescription('The name of the channel').setRequired(true))
				.addBooleanOption(option => option.setName('set_enabled').setDescription('[True / False]').setRequired(true)),
		)
		.addSubcommand(_paused =>
			_paused
				.setName('set_paused')
				.setDescription('Pause or Resume bot interaction for a channel (/commands will still work for the channel)')
				.addStringOption(option => option.setName('channel_name').setDescription('The name of the channel').setRequired(true))
				.addBooleanOption(option => option.setName('set_enabled').setDescription('[True (paused) / False (resumed)]').setRequired(true)),
		)
		.addSubcommand(_gmg =>
			_gmg
				.setName('set_gmg')
				.setDescription('Enable or Disable GMG for a channel')
				.addStringOption(option => option.setName('channel_name').setDescription('The name of the channel').setRequired(true))
				.addBooleanOption(option => option.setName('set_enabled').setDescription('[True / False]').setRequired(true)),
		),
	async execute(interaction) {
		const channelName = interaction.options.getString('channel_name');
		const set_enabled = interaction.options.getBoolean('set_enabled');
		let message = 'Base Channel Command';
		switch (interaction.options.getSubcommand()) {
		case 'status':
			logger.log('status subCommand');
			message = await channel_status(interaction, channelName);
			break;
		case 'set_responses':
			logger.log('set_responses subCommand');
			message = await channel_responses(interaction, channelName, set_enabled);
			break;
		case 'set_submissions':
			logger.log('set_submissions subCommand');
			message = await channel_submissions(interaction, channelName, set_enabled);
			break;
		case 'set_paused':
			logger.log('set_paused subCommand');
			message = await channel_paused(interaction, channelName, set_enabled);
			break;
		case 'set_gmg':
			logger.log('set_gmg subCommand');
			message = await channel_gmg(interaction, channelName, set_enabled);
			break;
		default:
			break;
		}
		await interaction.reply({ content: message, ephemeral: true });
	},
};

// Status SubCommand Functions
async function channel_status(interaction, channelName) {
	let message = `Status as of: \`${interaction.createdAt}\`\n\`\`\`Responses | Submissions | Paused | GMG\tChannel Name\n\n`;
	if (channelName == null) {
		const results = await mongoDriver.GetAllDocumentsSorted(CHANNELS_DB, { 'name': 1 });
		if (results != null) {
			for (let i = 0; i < results.length; i++) {
				message += constructStatusLine(results[i]);
			}
		}
	}
	else {
		const results = await mongoDriver.GetOneDocument({ 'name':channelName }, CHANNELS_DB);
		if (results != null) {
			message += constructStatusLine(results);
		}
	}
	message += '```';
	return message;
}
function constructStatusLine(channelInfo) {
	let str = '';
	if (channelInfo.isResponseChannel == true) {
		str += '    X    ';
	}
	else {
		str += '         ';
	}
	str += ' | ';
	if (channelInfo.isSubmissionChannel == true) {
		str += '     X     ';
	}
	else {
		str += '           ';
	}
	str += ' | ';
	if (channelInfo.isPaused == true) {
		str += '   X  ';
	}
	else {
		str += '      ';
	}
	str += ' | ';
	if (channelInfo.isGMG == true) {
		str += ' X ';
	}
	else {
		str += '   ';
	}
	str += '\t';
	str += `#${channelInfo.name}\n`;
	return str;
}

// Set_Responses subCommand Functions
async function channel_responses(interaction, channelName, set_enabled) {
	let message = '';
	const results = await mongoDriver.GetOneDocument({ 'name':channelName }, CHANNELS_DB);
	if (results != null) {
		mongoDriver.UpdateOneDocument({ '_id' : results._id }, { $set: { 'isResponseChannel' : set_enabled } }, CHANNELS_DB);
		if (set_enabled) {
			message = `Responses enabled on #${results.name}`;
			logger.log(`${interaction.user.tag} has enabled responses on #${channelName}`);
		}
		else {
			message = `Responses disabled on #${results.name}`;
			logger.log(`${interaction.user.tag} has disabled responses on #${channelName}`);
		}
	}
	else {
		message = `Did not find the channel: #${channelName}.`;
	}
	return message;
}

// Set_Submissions subCommand Functions
async function channel_submissions(interaction, channelName, set_enabled) {
	let message = '';
	const results = await mongoDriver.GetOneDocument({ 'name':channelName }, CHANNELS_DB);
	if (results != null) {
		mongoDriver.UpdateOneDocument({ '_id' : results._id }, { $set: { 'isSubmissionChannel' : set_enabled } }, CHANNELS_DB);
		if (set_enabled) {
			message = `Submissions enabled on #${results.name}`;
			logger.log(`${interaction.user.tag} has enabled submissions on #${channelName}`);
		}
		else {
			message = `Submissions disabled on #${results.name}`;
			logger.log(`${interaction.user.tag} has disabled submissions on #${channelName}`);
		}
	}
	else {
		message = `Did not find the channel: #${channelName}.`;
	}
	return message;
}

async function channel_paused(interaction, channelName, set_enabled) {
	let message = '';
	const results = await mongoDriver.GetOneDocument({ 'name':channelName }, CHANNELS_DB);
	if (results != null) {
		mongoDriver.UpdateOneDocument({ '_id' : results._id }, { $set: { 'isPaused' : set_enabled } }, CHANNELS_DB);
		if (set_enabled) {
			message = `Responses and Submissions paused on #${results.name}`;
			logger.log(`${interaction.user.tag} has paused #${channelName}`);
		}
		else {
			message = `Responses and Submissions resumed on #${results.name}`;
			logger.log(`${interaction.user.tag} has resumed #${channelName}`);
		}
	}
	else {
		message = `Did not find the channel: #${channelName}.`;
	}
	return message;
}

async function channel_gmg(interaction, channelName, set_enabled) {
	let message = '';
	const results = await mongoDriver.GetOneDocument({ 'name':channelName }, CHANNELS_DB);
	if (results != null) {
		mongoDriver.UpdateOneDocument({ '_id' : results._id }, { $set: { 'isGMG' : set_enabled } }, CHANNELS_DB);
		if (set_enabled) {
			message = `GMG enabled on #${results.name}`;
			logger.log(`${interaction.user.tag} has enabled GMG on #${channelName}`);
		}
		else {
			message = `GMG disabled on #${results.name}`;
			logger.log(`${interaction.user.tag} has disabled GMG on #${channelName}`);
		}
	}
	else {
		message = `Did not find the channel: #${channelName}.`;
	}
	return message;
}