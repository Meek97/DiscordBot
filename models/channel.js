const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ChannelSchema = new Schema({
	_id: String,
	name: String,
	guild: String,
	guildName: String,
	isResponseChannel: Boolean,
	isSubmissionChannel: Boolean,
	isPaused: Boolean,
	isGMG: Boolean
});
module.exports = mongoose.model('Channel', ChannelSchema);