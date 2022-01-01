const { SlashCommandBuilder } = require('@discordjs/builders');
const { ADMIN_ROLE_ID } = require('../config.json');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Gives a list of the bot\'s commands'),
	async execute(interaction) {
		let helpMessage = '__**Bot Commands:**__\n';
		let adminHelpMessage = '__**Admin Commands:**__\n';
		interaction.client.commands.forEach(
			function(_data, key) {
				if (_data.data.defaultPermission == false) adminHelpMessage += `\`/${key}\` - ${_data.data.description}\n`;
				else helpMessage += `\`/${key}\` - ${_data.data.description}\n`;
			});
		helpMessage += '\n__**Submit Command:**__\n';
		helpMessage += '`!submit` - Add a response to my database';
		if (interaction.member._roles.find(role => role == ADMIN_ROLE_ID)) {
			helpMessage = adminHelpMessage + '\n' + helpMessage;
		}
		await interaction.reply({ embeds: [{
			title: 'Bot Commands Help',
			description: helpMessage,
			footer: {
				text:'Unfortunately, slash commands don\'t support attatchments, so the submit command still uses !\nThis is a planned feature for the Discord.js API!',
			},
		}],
		ephemeral: true });
	},
};