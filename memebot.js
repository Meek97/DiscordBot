// https://discord.js.org/#/docs/main/stable/general/welcome

// IMPORTS
const { token, iCalAddress} = require('./config.json');

const mongooseDriver = require('./mongooseDriver');

const logger = require('./logger');
const weather = require('./weather');
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const fs = require('fs');
const got = require('got');
const ical = require('node-ical');
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout,
  });
// GLOBAL OBJECTS
const client = new Client({ 
	restRequestTimeout : 30000,
	intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
let gmgTitle = '';

// Script starting execution
InitBot();

async function InitBot() {
	logger.log('Bot script is starting... ');
	await mongooseDriver.Init();
	// client login
	// Wait for client to sucessfully log in
	// Register command and event handlers
	GetDiscordClientEventHandlers();
	GetOtherEventHandlers();
	GetCommandHandlers();
	GetTime();
	logger.log('logging bot client in');
	await client.login(token);
}
function GetTime() {

	gmgTitle = '';
	gmgMessages = '';

	const today = new Date();
	const EndTime = new Date();
	const MidNight = new Date();
	// clear the additional messages string
	// check what day of the week it is
	switch (today.getDay()) {
	// set GMG time for 10am instead of 8am on weekends
	// Sunday
	case 0:
		// set the date time to 8am
		EndTime.setHours(10, 0, 0, 0);
		break;
	// Saturday
	case 6:
		// set the date time to 8am
		EndTime.setHours(10, 0, 0, 0);
		break;
	// Mon - Fri
	default:
		// set the date time to 8am
		EndTime.setHours(8, 0, 0, 0);
		break;
	}
	// set the date time to 12am
	MidNight.setHours(0, 0, 0, 0);

	// Find the amount of time until our various events, by subtracting our desired time, from the current time
	const GMGTotal = Date.parse(EndTime) - Date.parse(today);
	let MidNightTotal = Date.parse(MidNight) - Date.parse(today);

	// if the "time until" is less than or equal to 0, add 24 hours (86400000 miliseconds)
	if (MidNightTotal <= 0) {MidNightTotal += 86400000;}

	// TODO: improve web events
	// Check for specific date events
	logger.log('Checking for special events... [' + (today.getMonth() + 1) + '/' + today.getDate() + ']');
	ical.fromURL(iCalAddress, {}, function(err, data) {
		for (const k in data) {
			const ev = data[k];
			if (isEventOccuringToday(ev)) {
				// Check for event attachments
				// All Day Event - announce event info with GMG message
				if (Date.parse(ev.end) - Date.parse(ev.start) == 86400000) {
					logger.log(`${ev.summary} happening all day`);
					gmgTitle += ev.summary;
					gmgMessages += ev.description;
				}
				else {
					// TODO: send calendar event messages
					// Get the amount of time until event start
					const eventTime = Date.parse(ev.start) - Date.parse(today);
					// The start time has already passed
					if (eventTime < 0) {
						logger.log(`${ev.summary} happing now`);
						// EventMessage(ev.summary, ev.description, ((today.getMonth() + 1) + '/' + today.getDate()));
					}
					else {
						logger.log(`${ev.summary} happing in ${TimeOutLog(eventTime)}`);
						// setTimeout(EventMessage(ev.summary, ev.description, ((today.getMonth() + 1) + '/' + today.getDate())), eventTime);
					}
				}
			}
		}
	});
	if (GMGTotal > 0) {
		logger.log('Good Morning Gamers in  ' + GMGTotal + ' miliseconds | ' + TimeOutLog(GMGTotal, Date.parse(today)));
		// setTimeout to call GMG function after total miliseconds
		setTimeout(module.exports.SendGoodMorning, GMGTotal);
	}
	else {
		logger.log('already passed gmg time for today. Will try again tomorrow');
	}
	// log time outs
	logger.log('Midnight in  ' + MidNightTotal + ' miliseconds | ' + TimeOutLog(MidNightTotal, Date.parse(today)));
	// Recursively call the Gettime() function at midnight
	setTimeout(GetTime, MidNightTotal);

}
function TimeOutLog(_milisecondsUntil, _miliseconds) {
	const endTime = new Date(_miliseconds + _milisecondsUntil);
	// Extrapolate seconds minuets and hours from our miliseconds total
	const seconds = Math.floor((_milisecondsUntil / 1000) % 60);
	const minutes = Math.floor((_milisecondsUntil / 1000 / 60) % 60);
	const hours = Math.floor((_milisecondsUntil / (1000 * 60 * 60)) % 24);
	return hours + ':' + minutes + ':' + seconds + ' | ' + (endTime.getMonth() + 1) + '/' + endTime.getDate() + '  ' + endTime.getHours() + ':' + endTime.getMinutes() + ':' + endTime.getSeconds();
}
function isEventOccuringToday(event) {
	const today = Date.parse(new Date());
	const eventStart = Date.parse(event.start);
	const eventEnd = Date.parse(event.end);

	// if the event start time is after now
	if (eventStart - today > 0) {
		return false;
	}
	// if the event start time is before now, and end time is after now
	else if (eventStart - today <= 0 && eventEnd - today >= 0) {
		return true;
	}
}
async function EventMessage(eventTitle, eventMessage, eventDate) {
	const Embed = new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(eventTitle)
		.setDescription(eventMessage);
	/*mongoDriver.GetManyDocuments({ 'isGMG' : true }, CHANNELS_DB).then(
		function(gmgChannels) {
			for (let i = 0; i < gmgChannels.length; i++) {
				// Check that the channel is not paused
				if (!gmgChannels[i].isPaused) {
					client.channels.fetch(gmgChannels[i]._id)
						.then(channel => channel.send({ embeds: [Embed] }))
						.catch(console.error);
				}
			}
		},
	);*/
}
function GetCommandHandlers() {
	client.commands = new Collection();
	const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		logger.log(`command handler found for ${command.data.name}`);
		// Set a new item in the Collection
		// With the key as the command name and the value as the exported module
		client.commands.set(command.data.name, command);
	}
}
function GetDiscordClientEventHandlers() {
	const eventFiles = fs.readdirSync('./client_events').filter(file => file.endsWith('.js'));
	for (const file of eventFiles) {
		const event = require(`./client_events/${file}`);
		logger.log(`discord client event handler found for ${event.name}`);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		}
		else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}
}
function GetOtherEventHandlers() {
	// Readline Events
	const eventFiles = fs.readdirSync('./readline_events').filter(file => file.endsWith('.js'));
	for (const file of eventFiles) {
		const event = require(`./readline_events/${file}`);
		logger.log(`readline event handler found for ${event.name}`);
		if (event.once) {
			readline.once(event.name, (...args) => event.execute(...args));
		}
		else {
			readline.on(event.name, (...args) => event.execute(...args));
		}
	}
}

/**
 * 
 * @param {MessagePaylod} payload a MessaagePayload object for the bot to send
 * @MessagePayload contains two parts 1: a MessageTarget (typically a TextBasedChannel Object) and 2: a MessaageOptions object
 */
exports.SendMessage = async(payload) => {
	// console.log(messageOptions);
	payload.target.send(payload);
};
exports.GetChannel = async(channelID) => {
	return await client.channels.fetch(channelID);
};
exports.SendGoodMorning = async() => {
	weather.UpdateWeatherReport().then(
		(weatherReport) => {
			const weatherReportDate = new Date(Date.parse(Date(weatherReport.current.dt)));
			// Create embed message object
			const embed = new MessageEmbed({
				color:'#0099ff',
				title:'Good Morning Gamers!',
				thumbnail:{url:'https://cdn.frankerfacez.com/emoticon/600212/4'},
				image:{url:'attachment://Forecast.png'},
				footer:{text:`weather provided by OpenWeatherAPI\nWeather last updated @ ${weatherReportDate.toLocaleString('en-US',{dateStyle:'short',timeStyle:'short'})}`}
			})
			mongooseDriver.Channels.find({ 'isGMG' : true }).then(
				function(gmgChannels) {
					for (let i = 0; i < gmgChannels.length; i++) {
						// Check that the channel is not paused
						if (!gmgChannels[i].isPaused) {
							client.channels.fetch(gmgChannels[i]._id)
								.then(channel => channel.send({	// Message Options
									embeds: [embed],
									// content : "",
									files : ['Forecast.png']
								}))
								.catch(console.error);
						}
					}
				});
		});
};