const { SlashCommandBuilder } = require('@discordjs/builders');
const { SUBMISSIONS_DB,CHANNELS_DB } = require('../config.json');
const mongoDriver = require('../MongoDriver');
const logger = require('../logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('react')
        .setDescription('Create a new emoji reaction for the bot')
        .setDefaultPermission(false)
        .addStringOption(option =>
			option.setName('key')
				.setDescription('The key that you want to remove')
				.setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
            .setDescription('test')
            .setRequired(true)),
    async execute(interaction) {
        logger.log('react command triggered');
        const guild = await interaction.guild.fetch();
        // check if the bot knows about this channel
		const _channel = await mongoDriver.GetOneDocument({ _id :  interaction.channelId}, CHANNELS_DB);
		// Exit if _channel returns empty
		if (!_channel) return;
		// exit if the channel is currently paused
		if (_channel.isPaused) return;
		// If the channel is an allowed submissions
        if (_channel.isSubmissionChannel) {
            const _emoji = interaction.options.getString('emoji');
            let _key = interaction.options.getString('key');
            _key = _key.toUpperCase().split(' ');
            if(_key.length > 1){
                await interaction.reply({ content:`Invalid key given for reaction submission`, ephemeral:true });
                return;
            }
            //Check for emojis using regular expression
            const regex = /\p{Emoji}+/gu;
            let regex_emoji = _emoji.match(regex);
            if(regex_emoji != null){

                if(regex_emoji.length > 1) regex_emoji = null;
                if(regex_emoji != null) { 
                    mongoDriver.GetOneDocument({ key:_key[0] }, SUBMISSIONS_DB).then(result => SaveReaction(result, regex_emoji, interaction, _key[0]));
                    /*
                    //check if there is a guild-emoji
                    let guild_emoji = guild.emojis.resolve(regex_emoji[0]);
                    if(guild_emoji == null) {
                        mongoDriver.GetOneDocument({ key:_key[0] }, SUBMISSIONS_DB).then(result => SaveReaction(result, regex_emoji, interaction, _key[0]));
                        //await interaction.reply({ content:`Reaction Submission ${regex_emoji}`, ephemeral:true });
                    }
                    else{
                        mongoDriver.GetOneDocument({ key:_key[0] }, SUBMISSIONS_DB).then(result => SaveReaction(result, guild_emoji, interaction, _key[0]));
                        //await interaction.reply({ content:`Reaction Submission ${guild_emoji}`, ephemeral:true });
                    }
                    */
                }
                else{
                    await interaction.reply({ content:`Invalid emoji given for reaction submission`, ephemeral:true });
                    return;
                }
            }
            else{
                await interaction.reply({ content:`Invalid emoji given for reaction submission`, ephemeral:true });
                return;
            }
        }
    }
};
async function SaveReaction(result, _emoji, interaction, key) {
    const guild = await interaction.guild.fetch();
	let duplicatekey = false;
	if (result != null) duplicatekey = true;
	// In order to have the ability for multiple responses per key, we have to make sure we are adding the responses as an array type
	const reactionObject = [];
	reactionObject[0] = { emoji: _emoji[0], author: interaction.user.username };
	//if there are no duplicates of the key, save to a new record
    if (!duplicatekey) {
		logger.log(`Adding new reactions for ${key}`);
		await mongoDriver.AddDocument({
			key: key,
			reactions: reactionObject,
            react:true
		}, SUBMISSIONS_DB).then(newDoc => newDoc);
	}
    //if there are duplicates to the key, update the existing record
	else {
		logger.log(`Updating existing reactions for ${key}`);
		await mongoDriver.UpdateOneDocument(
			{ key: key },
			{ $push: { reactions:reactionObject[0]}, 
            $set: {react:true}},
			SUBMISSIONS_DB).then(newDoc => newDoc);
	}
    //confirm to the user that the submission has been taken by the bot

    //check if there is a guild-emoji
    let guild_emoji = guild.emojis.resolve(_emoji[0]);
    if(guild_emoji == null) {
        //mongoDriver.GetOneDocument({ key:key[0] }, SUBMISSIONS_DB).then(result => SaveReaction(result, regex_emoji, interaction, _key[0]));
        await interaction.reply({ embeds: [{
            title: 'Reaction Added',
            description: `Key: \`${key}\`\nAuthor: ${interaction.user.username}\nSubmission: ${_emoji[0]}`,
            footer: {
                text: 'This has been added to my database, and can be used right away!',
            },
        }] },
        );
    }
    else{
        //mongoDriver.GetOneDocument({ key: key[0] }, SUBMISSIONS_DB).then(result => SaveReaction(result, guild_emoji, interaction, _key[0]));
        await interaction.reply({ embeds: [{
            title: 'Reaction Added',
            description: `Key: \`${key}\`\nAuthor: ${interaction.user.username}\nSubmission: ${guild_emoji}`,
            footer: {
                text: 'This has been added to my database, and can be used right away!',
            },
        }] },
        );
    }
    /*
	await interaction.reply({ embeds: [{
		title: 'Reaction Added',
		description: `Key: \`${key}\`\nAuthor: ${interaction.user.username}\nSubmission: ${_emoji[0]}`,
		footer: {
			text: 'This has been added to my database, and can be used right away!',
		},
	}] },
	);
    */
}