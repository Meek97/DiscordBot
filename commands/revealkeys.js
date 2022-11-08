const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const mongooseDriver = require('../mongooseDriver');

const REVEAL_KEYS_LENGTH = 20;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('revealkeys')
		.setDescription('Gives a list of the bot\'s responses')
		.addIntegerOption(option =>
			option.setName('page')
				.setDescription('The page # that you want to see (-1 to show all)')
				.setRequired(false)),
	async execute(interaction) {
		const keyPage = interaction.options.getInteger('page');
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('reveal_prev')
					.setLabel('Previous')
					.setStyle('PRIMARY'),
				new MessageButton()
					.setCustomId('reveal_next')
					.setLabel('Next')
					.setStyle('PRIMARY'),
			);
		let startingIndex = 0;
		if (keyPage) {
			startingIndex = (REVEAL_KEYS_LENGTH * keyPage) - REVEAL_KEYS_LENGTH;
		}
		const results = await mongooseDriver.Responses.find({}).sort({ key:1 });
		let messageBody = '';
		let messageTitle = '';
		if (keyPage == -1) {
			for (let i = 0; i < results.length;i++) {
				messageBody += '* `' + results[i].key + '`';
				if (results[i].args.length > 1) {
					messageBody += ' [' + results[i].args.length + ']';
				}
				messageBody += '\n';
			}
			messageTitle = results.length;
		}
		else {
			for (let i = startingIndex; i < (startingIndex + REVEAL_KEYS_LENGTH);i++) {
				if (i >= results.length) break;
				messageBody += '* `' + results[i].key + '`';
				if (results[i].submissions.length > 1) {
					messageBody += ' [' + results[i].submissions.length + ']';
				}
				messageBody += '\n';
			}
			messageTitle = `Page: ${ (startingIndex / REVEAL_KEYS_LENGTH) + 1 }/${Math.ceil(results.length / REVEAL_KEYS_LENGTH)}`;
		}
		await interaction.reply({ embeds : [{
			title : 'List Of My Response Keys | ' + messageTitle,
			description : messageBody,
			footer: {
				icon_url: '',
				text: 'Keys that have more than one response are shown with a [*] after the key',
			},
		}],
		components: [row],
		ephemeral: true,
		});
	},
	async next(interaction, index, modifier) {
		let keyPage = index + modifier;
		const results = await mongooseDriver.Responses.find({}).sort({ key:1 });
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('reveal_prev')
					.setLabel('Previous')
					.setStyle('PRIMARY'),
				new MessageButton()
					.setCustomId('reveal_next')
					.setLabel('Next')
					.setStyle('PRIMARY'),
			);
		if (keyPage > Math.ceil(results.length / REVEAL_KEYS_LENGTH)) keyPage = 1;
		if (keyPage < 1) keyPage = Math.ceil(results.length / REVEAL_KEYS_LENGTH);
		let startingIndex = 0;
		if (keyPage) {
			startingIndex = (REVEAL_KEYS_LENGTH * keyPage) - REVEAL_KEYS_LENGTH;
		}
		let messageBody = '';
		let messageTitle = '';
		if (keyPage == -1) {
			for (let i = 0; i < results.length;i++) {
				messageBody += '* `' + results[i].key + '`';
				if (results[i].submissions.length > 1) {
					messageBody += ' [' + results[i].submissions.length + ']';
				}
				messageBody += '\n';
			}
			messageTitle = results.length;
		}
		else {
			for (let i = startingIndex; i < (startingIndex + REVEAL_KEYS_LENGTH);i++) {
				if (i >= results.length) break;
				messageBody += '* `' + results[i].key + '`';
				if (results[i].submissions.length > 1) {
					messageBody += ' [' + results[i].submissions.length + ']';
				}
				messageBody += '\n';
			}
			messageTitle = `Page: ${ (startingIndex / REVEAL_KEYS_LENGTH) + 1 }/${Math.ceil(results.length / REVEAL_KEYS_LENGTH)}`;
		}
		await interaction.update({ embeds : [{
			title : 'List Of My Response Keys | ' + messageTitle,
			description : messageBody,
			footer: {
				icon_url: '',
				text: 'Keys that have more than one response are shown with a [*] after the key',
			},
		}],
		components: [row],
		ephemeral: true,
		});
	},
};