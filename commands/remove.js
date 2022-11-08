const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { SUBMISSIONS_DB } = require('../config.json');
const wait = require('util').promisify(setTimeout);
const mongooseDriver = require('../mongooseDriver');
const logger = require('../logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove all responses for a specific key')
		.setDefaultPermission(false)
		.addStringOption(option =>
			option.setName('key')
				.setDescription('The key that you want to remove')
				.setRequired(true)),
	async execute(interaction) {
		const temp = interaction.options.getString('key').toUpperCase();
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('remove_prev')
					.setLabel('Previous')
					.setStyle('PRIMARY'),
				new MessageButton()
					.setCustomId('remove_next')
					.setLabel('Next')
					.setStyle('PRIMARY'),
				new MessageButton()
					.setCustomId('remove_delete')
					.setLabel('[Wait 3s]')
					.setStyle('DANGER')
					.setDisabled(true),
			);
		const results = await mongooseDriver.Responses.findOne({key: temp});
		if (results == null) {
			await interaction.reply({ content:`Did not find any response entries under \`${temp}\``, ephemeral:true });
		}
		else {
			const numResults = results.submissions.length;
			if (numResults == 1) {
				row.components[0].setDisabled(true);
				row.components[1].setDisabled(true);
			}
			const messageHeader = `\`${temp}\`|1|${numResults}\n`;
			await interaction.reply({ content: messageHeader + results.submissions[0].response, components: [row], ephemeral:true });
			row.components[2].setLabel('Delete ALL');
			row.components[2].setDisabled(false);
			await wait(3000);
			await interaction.editReply({ components: [row] });
		}
	},
	async next(interaction, _key, index, modifier) {
		const results = await mongooseDriver.Responses.findOne({key:_key});
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
	async delete(interaction, _key) {
		console.log('removing entry');
		const results = await mongooseDriver.Responses.findOne({key:_key});
		if (results == null) {
			await interaction.update({ content: `Did not find any response entries under \`${_key}\``, components: [] });
		}
		else {
			const remove_results = await mongooseDriver.Responses.deleteOne({key:_key});
			if (remove_results == null) {
				await interaction.update({ content: `Ran into an issue when trying to update: \`${_key}\``, components: [] });
			}
			else {
				logger.log(`${interaction.user.tag} deleted all responses for: ${_key}`);
				const messageHeader = `Responses deleted for: \`${_key}\``;
				await interaction.update({ content: messageHeader, components: [] });
			}
		}
	},
};