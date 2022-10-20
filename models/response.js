const mongoose = require('mongoose');
const submission = require('./submission');
const Schema = mongoose.Schema;

const ResponseSchema = new Schema({
	_id: Schema.Types.ObjectID,
	key: {
		type: String,
		required: true,
		unique: true
	},
	submissions: [submission.schema]
});
module.exports = mongoose.model('Response', ResponseSchema);