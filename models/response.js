const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubmissionSchema = new Schema({
	response: {
		type: String,
		required: true,
		validate : {
			validator: (v) => {
				// regex that we can use to determine a valid URL
				const regexPattern = '((http|https)://)(www.)?[a-zA-Z0-9@:%._\\+~#?&/=]{2,256}.[a-z]{2,6}/([-a-zA-Z0-9@:%._\\+~#?&//=]*)';
				// Test if the response given passes the regex test, qualifying that it is a valid URL
				return regexPattern.test(v);
			},
			message: 'You must provide a valid URL'
		}
	},
	author: {
		type:String,
		required:true
	},
	submissionType: {
		type: String,
		required: true,
		enum: ['link', 'image', 'reaction',]
	},
	submissionDate:{
		type: Date,
		default: Date.now
	}
});
const ResponseSchema = new Schema({
	_id: Schema.Types.ObjectID,
	key: {
		type: String,
		required: true,
		unique: true
	},
	submissions: [SubmissionSchema]
});
module.exports.Response = mongoose.model('Response', ResponseSchema);
module.exports.Submission = mongoose.model('Submission', SubmissionSchema);