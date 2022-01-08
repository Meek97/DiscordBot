// https://discord.js.org/#/docs/main/stable/general/welcome

// IMPORTS
const { token, guildId, CHANNELS_DB, ADMIN_ROLE_ID, iCalAddress, openweathertoken } = require('./config.json');
const mongoDriver = require('./MongoDriver.js');
const logger = require('./logger');

const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const fs = require('fs');
const got = require('got');
const ical = require('node-ical');
// GLOBAL OBJECTS
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
let gmgTitle = '';
let gmgMessages = '';

// Script starting execution
InitBot();

async function InitBot() {
	logger.log('Bot script is starting... ');
	mongoDriver.init();
	await mongoDriver.ConnectDB();
	// client login
	logger.log('logging bot client in');
	// Wait for client to sucessfully log in
	await client.login(token);
	// Register command and event handlers
	GetEventHandlers();
	GetCommandHandlers();
	GetTime();
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
					// Get the amount of time until event start
					const eventTime = Date.parse(ev.start) - Date.parse(today);
					// The start time has already passed
					if (eventTime < 0) {
						logger.log(`${ev.summary} happing now`);
						EventMessage(ev.summary, ev.description, ((today.getMonth() + 1) + '/' + today.getDate()));
					}
					else {
						logger.log(`${ev.summary} happing in ${TimeOutLog(eventTime)}`);
						setTimeout(EventMessage(ev.summary, ev.description, ((today.getMonth() + 1) + '/' + today.getDate())), eventTime);
					}
				}
			}
		}
	});
	if (GMGTotal > 0) {
		logger.log('Good Morning Gamers in  ' + GMGTotal + ' miliseconds | ' + TimeOutLog(GMGTotal, Date.parse(today)));
		// setTimeout to call GMG function after total miliseconds
		setTimeout(GMG, GMGTotal);
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
	const today = new Date();
	// if the event start time is after now
	if (Date.parse(event.start) - Date.parse(today) > 0) {
		return false;
	}
	// if the event start time is before now, and end time is after now
	else if (Date.parse(event.start) - Date.parse(today) <= 0 && Date.parse(event.end) - Date.parse(today) >= 0) {
		return true;
	}
}
async function GetWeather(latitude, longitude) {
	const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&units=imperial&exclude=minutely,hourly&appid=${openweathertoken}`;
	try {
		const body = await got(url).json();
		return body;
	}
	catch (error) {
		console.error(error);
	}
	return null;
}
async function GMG() {
	logger.log('GMG Time!');
	const weatherResults = await GetWeather('40.86', '-81.40');
	/*
		weatherResults
			.current
				.temp
				.humidity -% of humidity
				.wind_speed
				.clouds	-% of cloud coverage
				.rain
				.snow
				.weather.description
			.daily
				.temp.max
				.temp.min
				.humidity -% of humidity
				.wind_speed
				.clouds -% of cloud coverage
				.pop	-probability of precipitation
				.weather.description
			.alters
				.event
				.start
				.end
				.description
	*/
	const Embed = new MessageEmbed()
		.setColor('#0099ff')
		.setTitle('GMG!')
		.setThumbnail('https://cdn.frankerfacez.com/emoticon/600212/4')
		.setDescription('Good Morning Gamers')
		.setFooter('weather provided by OpenWeatherAPI');
	if (gmgMessages != '') {
		Embed.addFields({ name: gmgTitle, value: gmgMessages });
	}
	Embed.addFields(
		{ name: '\u200B', value: '\u200B' },
		{ name: 'Current Weather', value: `${weatherResults.current.weather[0].description}` },
		{ name: 'Temp', value: `${Math.round(weatherResults.current.temp)}\xB0F`, inline: true },
		{ name: 'Hi / Lo', value: `${Math.round(weatherResults.daily[0].temp.max)}\xB0F / ${Math.round(weatherResults.daily[0].temp.min)}\xB0F`, inline: true },
		{ name: 'Precipitation', value: `${(weatherResults.daily[0].pop * 100)}%`, inline: true },
	);
	Embed.addFields(
		{ name: 'Humidity', value: `${Math.round(weatherResults.daily[0].humidity)}%`, inline: true },
		{ name: '\u200B', value: '\u200B', inline: true },
		{ name: 'Wind', value: `${weatherResults.daily[0].wind_speed} MPH`, inline: true },
	);
	mongoDriver.GetManyDocuments({ 'isGMG' : true }, CHANNELS_DB).then(
		function(gmgChannels) {
			for (let i = 0; i < gmgChannels.length; i++) {
				// Check that the channel is not paused
				if (!gmgChannels[i].isPaused) {
					client.channels.fetch(gmgChannels[i]._id)
						.then(channel => channel.send({ embeds: [Embed] }))
						.catch(console.error);
				}
			}
		});
}
async function EventMessage(eventTitle, eventMessage, eventDate) {
	const Embed = new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(eventTitle)
		.setDescription(eventMessage);
	mongoDriver.GetOneDocument({ 'date': `${eventDate}` }, 'event_attachments')
		.then(
			function(Attach) {
				mongoDriver.GetManyDocuments({ 'isGMG' : true }, CHANNELS_DB).then(
					function(gmgChannels) {
						for (let i = 0; i < gmgChannels.length; i++) {
							// Check that the channel is not paused
							if (!gmgChannels[i].isPaused) {
								client.channels.fetch(gmgChannels[i]._id)
									.then(channel => (Attach == null) ? channel.send({ embeds: [Embed] }) : channel.send({ embeds: [Embed], files: [Attach.url] }))
									.catch(console.error);
							}
						}
					},
				);
			});
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
	UpdateCommandPerms();
}
async function UpdateCommandPerms() {
	if (!client.application?.owner) await client.application?.fetch();
	// Get the guild object reference
	const guild = await client.guilds.cache.get(guildId);
	// Get a collection of all of the bot commands from the guild
	const allCommands = await guild.commands.fetch();
	// Iterate through all commands
	allCommands.forEach(
		function(_data, key) {
			/*
			If the defaultPermission property is set to false. If no 'defaultPermission' property was defined
			when the command was created, this property will be 'undefined', but will be accessible with default permissions
			*/
			if (_data.defaultPermission == false) {
				// Define our admin role level permission
				// anyone with the defined 'admin role' (in config.json) will have permission to use these commands
				const perm = [
					{
						id: ADMIN_ROLE_ID,
						type: 'ROLE',
						permission: true,
					},
				];
				logger.log(`Settings perms for ${_data.name}`);
				// save command permissions
				client.application.commands.permissions.set({ guild: guildId, command: key, permissions: perm });
			}
		});
}
function GetEventHandlers() {
	const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
	for (const file of eventFiles) {
		const event = require(`./events/${file}`);
		logger.log(`event handler found for ${event.name}`);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		}
		else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}
}