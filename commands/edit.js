const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { SUBMISSIONS_DB } = require('../config.json');
const mongoDriver = require('../MongoDriver');
const logger = require('../logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('edit')
		.setDescription('Edit the responses for a specific key')
		.setDefaultPermission(true)
		.addStringOption(option =>
			option.setName('key')
				.setDescription('The key that you want to edit')
				.setRequired(true)),
	async execute(interaction) {
		const temp = interaction.options.getString('key').toUpperCase();
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('edit_prev')
					.setLabel('Previous')
					.setStyle('PRIMARY'),
				new MessageButton()
					.setCustomId('edit_next')
					.setLabel('Next')
					.setStyle('PRIMARY'),
				new MessageButton()
					.setCustomId('edit_delete')
					.setLabel('Delete')
					.setStyle('DANGER'),
			);
		const results = await mongoDriver.GetOneDocument({ key : temp }, SUBMISSIONS_DB);
		if (results == null) {
			await interaction.reply({ contents:`Did not find any response entries under \`${temp}\``, ephemeral:true });
		}
		else {
			const numResults = results.submissions.length;
			if (numResults == 1) {
				row.components[0].setDisabled(true);
				row.components[1].setDisabled(true);
			}
			const messageHeader = `\`${temp}\`|1|${numResults}\n`;
			await interaction.reply({ content: messageHeader + results.submissions[0].response, components: [row], ephemeral: true });
		}
	},
	async next(interaction, _key, index, modifier) {
		const results = await mongoDriver.GetOneDocument({ key : _key }, SUBMISSIONS_DB);
		if (results == null) {
			await interaction.update({ content: `Did not find any response entries under \`${_key}\``, components: [] });
		}
		else {
			const numResults = results.submissions.length;
			if ((index + modifier) > numResults) index = 1;
			else if ((index + modifier) < 1) index = numResults;
			else index = index + modifier;
			const messageHeader = `\`${_key}\`|${index}|${numResults}\n`;
			await interaction.update({ content: messageHeader + results.submissions[index - 1].response });
		}
	},
	async delete(interaction, _key, index) {
		const results = await mongoDriver.GetOneDocument({ key : _key }, SUBMISSIONS_DB);
		if (results == null) {
			await interaction.update({ content: `Did not find any response entries under \`${_key}\``, components: [] });
		}
		else {
			let edit_results;
			if (results.submissions.length > 1) {
				results.submissions.splice((index - 1), 1);
				edit_results = await mongoDriver.UpdateOneDocument(
					{ key:_key },
					{ $set: { submissions : results.submissions } },
					SUBMISSIONS_DB);
			}
			else {
				edit_results = await mongoDriver.RemoveOneDocument({ key: _key }, SUBMISSIONS_DB);
			}
			if (edit_results == null) {
				await interaction.update({ content: `Ran into an issue when trying to update: \`${_key}\``, components: [] });
			}
			else {
				logger.log(`${interaction.user.tag} removed an entry from: ${_key}`);
				const messageHeader = `Entry removed from \`${_key}\``;
				await interaction.update({ content: messageHeader, components: [] });
			}
		}
	},
};