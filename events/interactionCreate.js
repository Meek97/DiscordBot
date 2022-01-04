const edit = require('../commands/edit');
const remove = require('../commands/remove');
const reveal = require('../commands/revealkeys');
const logger = require('../logger');
module.exports = {
	name: 'interactionCreate',
	once: false,
	async execute(interaction) {
		// exit if the interaction is NOT a slash command
		if (interaction.isCommand()) {
			if (interaction.channel == null) {
				logger.log('An interaction was created in a channel that wasn\'t already cached');
			}
			if (interaction.command == null) {
				logger.log('A command has been called that wasn\'t already cached');
			}
			logger.log(`${interaction.user.tag} in #${interaction.channel.name} triggered the /${interaction.commandName} command.`);
			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) return;

			try {
				await command.execute(interaction);
			}
			catch (err) {
				console.error(err);
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
		else if (interaction.isButton()) {
			logger.log(`${interaction.user.tag} in #${interaction.channel.name} clicked on the ${interaction.customId} button for message: ${interaction.message.id}.`);
			try {
				if (interaction.customId == 'cancel') {
					try {
						interaction.message.dismiss();
					}
					catch (err) {
						console.log(err);
						// console.error(err);
					}
				}
				if (interaction.customId.includes('edit')) {
					if (interaction.user == interaction.message.interaction.user) {
						const args = interaction.message.content.split('|');
						if (interaction.customId == 'edit_next') edit.next(interaction, args[0].slice(1, args[0].length - 1), parseInt(args[1]), 1);
						else if (interaction.customId == 'edit_prev') edit.next(interaction, args[0].slice(1, args[0].length - 1), parseInt(args[1]), -1);
						else if (interaction.customId == 'edit_delete') edit.delete(interaction, args[0].slice(1, args[0].length - 1), parseInt(args[1]));
					}
					else {
						await interaction.reply({ content: 'Only the user who started this command can reply', ephemeral: true });
					}
				}
				else if (interaction.customId.includes('remove')) {
					if (interaction.user == interaction.message.interaction.user) {
						const args = interaction.message.content.split('|');
						if (interaction.customId == 'remove_next') remove.next(interaction, args[0].slice(1, args[0].length - 1), parseInt(args[1]), 1);
						else if (interaction.customId == 'remove_prev') remove.next(interaction, args[0].slice(1, args[0].length - 1), parseInt(args[1]), -1);
						else if (interaction.customId == 'remove_delete') remove.delete(interaction, args[0].slice(1, args[0].length - 1));
					}
					else {
						await interaction.reply({ content: 'Only the user who started this command can reply', ephemeral: true });
					}
				}
				else if (interaction.customId.includes('reveal')) {
					// List of My Response Keys | Page: 3/5
					const args = interaction.message.embeds[0].title.split(' ');
					const pages = args[args.length - 1];
					const pageIndex = parseInt(pages.slice(0, 1));
					if (interaction.customId == 'reveal_next') reveal.next(interaction, pageIndex, 1);
					else if (interaction.customId == 'reveal_prev') reveal.next(interaction, pageIndex, -1);
				}
			}
			catch (err) {
				await interaction.update({ content: 'There was an error while executing this command!' });
			}
		}
	},
};

