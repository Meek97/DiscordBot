const { MongoClient } = require('mongodb');
const { DB_URI, DB_NAME } = require('./config.json');
const logger = require('./logger');
const QUERRY_LOGGING = false;
module.exports = {
	db_uri : DB_URI,
	db_name : DB_NAME,
	mongoClient : null,
	init: function() {
		if (!this.mongoClient) {
			logger.log('no mongo client created. creating new client now');
			this.mongoClient = new MongoClient(this.db_uri);
		}
		else {
			logger.log(this.mongoClient.db_name);
		}
	},
	ConnectDB: async function() {
		try {
			await this.mongoClient.connect();
			logger.log('Connected to Mongo DB Successfully!');
		}
		catch (err) {
			logger.log(err);
		}
	},
	DisconnectDB: async function() {
		try {
			await this.mongoClient.close();
			logger.log('Disconnected to Mongo DB Successfully!');
		}
		catch (err) {
			logger.log(err);
		}
	},
	AddDocument: async function(newObject, collection) {
		const DBcollection = this.mongoClient.db(this.db_name).collection(collection);
		let result;
		if (newObject._id == null) {
			result = await DBcollection.insertOne(newObject);
			logger.log('Added new document into database with ID: ' + result.insertedId);
		}
		else {
			result = await DBcollection.insertOne(newObject);
			logger.log('Added new document into database with ID: ' + result.insertedId);
		}
		return result;
	},
	GetAllDocuments: async function(collection) {
		const DBcollection = this.mongoClient.db(this.db_name).collection(collection);
		const results = await DBcollection.find();
		return results.toArray();
	},
	GetAllDocumentsSorted: async function(collection, sortOrder) {
		const DBcollection = this.mongoClient.db(this.db_name).collection(collection);
		const results = await DBcollection.find().sort(sortOrder);
		return results.toArray();
	},
	GetManyDocuments: async function(query, collection) {
		const DBcollection = this.mongoClient.db(this.db_name).collection(collection);

		const result = await DBcollection.find(query).toArray();
		if (result) {
			return result;
		}
		else {
			return result;
		}
	},
	GetOneDocument: async function(query, collection) {
		const DBcollection = this.mongoClient.db(this.db_name).collection(collection);

		const result = await DBcollection.findOne(query);
		if (result) {
			if (QUERRY_LOGGING) logger.log(`Document found in collection: ${collection}\t${JSON.stringify(query)}`);
			return result;
		}
		else {
			if (QUERRY_LOGGING) logger.log(`Document NOT found in collection: ${collection}\t${JSON.stringify(query)}`);
			return null;
		}
	},
	UpdateOneDocument: async function(querry, update, collection) {
		const DBcollection = this.mongoClient.db(this.db_name).collection(collection);
		const result = await DBcollection.updateOne(querry, update);
		if (result) {
			return result;
		}
		else {
			return null;
		}
	},
	RemoveOneDocument: async function(querry, collection) {
		const DBcollection = this.mongoClient.db(this.db_name).collection(collection);
		const result = await DBcollection.deleteOne(querry);
		if (result.deletedCount > 0) {
			return true;
		}
		else {
			return false;
		}
	},
};
