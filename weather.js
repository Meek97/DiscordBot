const {openweathertoken} = require('./config.json');
const {createCanvas, loadImage} = require('canvas');
const got = require('got');
const fs = require('fs');

const myCanvas = createCanvas(264,326);
const ctx = myCanvas.getContext('2d');

let report = require('./report.json');
let last_report_time = new Date(0);

const WeatherCodes = {
	// Thunderstorms
	200 :	`thunderstorm with light rain`,
	201	:	`thunderstorm with rain`,
	202	:	`thunderstorm with heavy rain`,
	210	:	`light thunderstorm`,
	211	:	`thunderstorm`,
	212	:	`heavy thunderstorm`,
	221	:	`ragged thunderstorm`,
	230	:	`thunderstorm with light drizzle`,
	231	:	`thunderstorm with drizzle`,
	232	:	`thunderstorm with heavy drizzle`,
	// Drizzle
	300	:	`light intensity drizzle`,
	301	:	`drizzle`,
	302	:	`heavy intensity drizzle`,
	310	:	`light intensity drizzle rain`,
	311	:	`drizzle rain`,
	312	:	`heavy intensity drizzle rain`,
	313	:	`shower rain and drizzle`,
	314	:	`heavy shower rain and drizzle`,
	321	:	`shower drizzle`,
	// Rain
	500	:	`light rain`,
	501	:	`moderate rain`,
	502	:	`heavy intensity rain`,
	503	:	`very heavy rain`,
	504	:	`extreme rain`,
	511	:	`freezing rain`,
	520	:	`light intensity shower rain`,
	521	:	`shower rain`,
	522	:	`heavy intensity shower rain`,
	531	:	`ragged shower rain`,
	// Snow
	600	:	`light snow`,
	601	:	`Snow`,
	602	:	`Heavy snow`,
	611	:	`Sleet`,
	612	:	`Light shower sleet`,
	613	:	`Shower sleet`,
	615	:	`Light rain and snow`,
	616	:	`Rain and snow`,
	620	:	`Light shower snow`,
	621	:	`Shower snow`,
	622	:	`Heavy shower snow`,
	// Atmosphere
	701	:	`mist`,
	711	:	`Smoke`,
	721	:	`Haze`,
	731	:	`sand/ dust whirls`,
	741	:	`fog`,
	751	:	`sand`,
	761	:	`dust`,
	762	:	`volcanic ash`,
	771	:	`squalls`,
	781	:	`tornado`,
	// Clear
	800	:	`clear sky`,
	// Clouds
	801	:	`few clouds`,
	802	:	`scattered clouds`,
	803	:	`broken clouds`,
	804	:	`overcast clouds`

};
const WeatherIcons = {
	// Thunderstorms
	200	:	`11`,
	201	:	`11`,
	202	:	`11`,
	210	:	`11`,
	211	:	`11`,
	212	:	`11`,
	221	:	`11`,
	230	:	`11`,
	231	:	`11`,
	232	:	`11`,
	// Drizzle
	300	:	`09`,
	301	:	`09`,
	302	:	`09`,
	310	:	`09`,
	311	:	`09`,
	312	:	`09`,
	313	:	`09`,
	314	:	`09`,
	321	:	`09`,
	// Rain
	500	:	`10`,
	501	:	`10`,
	502	:	`10`,
	503	:	`10`,
	504	:	`10`,
	511	:	`13`,
	520	:	`09`,
	521	:	`09`,
	522	:	`09`,
	531	:	`09`,
	// Snow
	600	:	`13`,
	601	:	`13`,
	602	:	`13`,
	611	:	`13`,
	612	:	`13`,
	613	:	`13`,
	615	:	`13`,
	616	:	`13`,
	620	:	`13`,
	621	:	`13`,
	622	:	`13`,
	// Atmosphere
	701	:	`50`,
	711	:	`50`,
	721	:	`50`,
	731	:	`50`,
	741	:	`50`,
	751	:	`50`,
	761	:	`50`,
	762	:	`50`,
	771	:	`50`,
	781	:	`50`,
	// Clear
	800	:	`01`,
	// Clouds
	801	:	`02`,
	802	:	`03`,
	803	:	`04`,
	804	:	`04`
};
const MonthLookup = {
	0 : 'Jan',
	1 : 'Feb',
	2 : 'Mar',
	3 : 'Apr',
	4 : 'May',
	5 : 'Jun',
	6 : 'Jul',
	7 : 'Aug',
	8 : 'Sep',
	9 : 'Oct',
	10: 'Nov',
	11: 'Dec'
};

exports.GetReport = async (latitude, longitude) => {
	const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&units=imperial&exclude=minutely,hourly&appid=${openweathertoken}`;
	const time_since_last_report = Date.now() - last_report_time;
	const last_report_date = new Date(last_report_time);
	if(time_since_last_report > 10800000){
		console.log(`last report was more than 3 hours ago (${last_report_date.toDateString()} | ${last_report_date.getHours()}:${last_report_date.getMinutes()}).. requesting new report...`);
		last_report_time = Date.now();
		try {
			report = await got(url).json();
			console.log('new weather report generated');
		}
		catch (error) {
			console.error(error);
			return null;
		}
	}
	else{
		console.log(`report was pulled in the last 3 hours (${last_report_date.toDateString()} | ${last_report_date.getHours()}:${last_report_date.getMinutes()})`);
	}
	return report;
};

exports.GetForecastCanvas = async () => {
	await this.GetReport('40.86', '-81.40');

	// Backgorund Color
	ctx.fillStyle= '#4ea2a8';
	// ctx.fillRect(0,0,450,400);
	
	// Background Ground
	ctx.fillStyle = '#1c6f3a';
	// ctx.fillRect(0,375,450,25);

	

	await drawKey();
	//await drawClouds();


	fs.writeFileSync('Forecast.png',myCanvas.toBuffer('image/png', { compressionLevel: 0, filters: myCanvas.PNG_FILTER_NONE }));
};

async function drawKey() {

	const last_report_date = new Date(last_report_time);

	const originX = 1;
	const originY = 1;
	const lightTextColor = '#dddfeb';
	const darkTextColor = '#5a585c';
	const altTextColor = '#8db1b8';
	// Available Region from 150,50 - 400,350
	ctx.beginPath();
	ctx.moveTo(originX,originY+12);
	ctx.arcTo(
		originX,originY+324,
		originX+250,originY+324,
		12);
	ctx.arcTo(
		originX+262,originY+324,
		originX+262,originY+12,
		12);
	ctx.arcTo(
		originX+262,originY,
		originX+12,originY,
		12);
	ctx.arcTo(
		originX,originY,
		originX,originY+12,
		12);
	const lingrad = ctx.createLinearGradient(132,0,132,326);
	lingrad.addColorStop(0.1,'#191024');
	lingrad.addColorStop(0.8,'#4c3569');
	lingrad.addColorStop(1,'#544e5c');
	ctx.fillStyle = lingrad;
	ctx.fill();

	ctx.fillStyle= darkTextColor;
	// Header Line
	ctx.beginPath();
	ctx.moveTo(originX,originY+42);
	ctx.lineTo(originX+262,originY+42);
	ctx.stroke();

	// console.log(report.daily[0].weather[0].id);
	await loadIcon(WeatherIcons[report.daily[0].weather[0].id],originX+130,originY+20,125,125);

	// Weather Icon Line
	ctx.beginPath();
	ctx.moveTo(originX+130,originY+42);
	ctx.lineTo(originX+130,originY+177);
	ctx.arc(originX+142,originY+177,12,Math.PI,(Math.PI)/2,true);
	ctx.lineTo(originX+262,originY+189);
	ctx.stroke();

	ctx.font = '24px Sans';
	ctx.fillStyle = lightTextColor;
	ctx.fillText('Today\'s Forecast', originX+10, originY+32);
	
	ctx.font = '20px Sans';
	ctx.fillStyle = altTextColor;
	ctx.fillText(
		`${MonthLookup[last_report_date.getMonth()]} ${last_report_date.getDate()} ${last_report_date.getFullYear()}\n@  ${last_report_date.getHours().toString().padStart(2,"0")}:${last_report_date.getMinutes().toString().padStart(2,"0")}`,
		originX+15,originY+72);
	ctx.font = '18px Sans';
	ctx.fillStyle = darkTextColor;
	// Current Temp
	ctx.fillText(`Current Temp`, originX+15,originY+132);	
	// Hi Lo Temperature
	ctx.fillText(`Hi | Lo`, originX+15, originY+182);
	// Precipitaiton
	ctx.fillText(`Precipiation`, originX+15, originY+232);
	// Humidity
	ctx.fillText(`Humidity`, originX+140, originY+232);
	// Wind
	ctx.fillText(`Wind`, originX+15, originY+282);
	// Clouds
	ctx.fillText(`Cloud Cover`, originX+140, originY+282);

	ctx.fillStyle= lightTextColor;
	// Weather Description
	ctx.fillText(WordWrap(WeatherCodes[report.daily[0].weather[0].id],12),originX+140,originY+132);
	// Current Temp
	ctx.fillText(`${report.current.temp.toFixed()}° F`,originX+15,originY+152)
	// Hi Lo Temp
	ctx.fillText(`${report.daily[0].temp.max.toFixed()}° F | ${report.daily[0].temp.min.toFixed()}° F`, originX+15, originY+202)
	// Precipitation
	ctx.fillText(`${(report.daily[0].pop * 100).toFixed(2)}%`, originX+15, originY+252)
	// Humidity
	ctx.fillText(`${report.daily[0].humidity.toFixed(2)}%`, originX+140, originY+252)
	// Wind
	ctx.fillText(`${report.daily[0].wind_speed.toFixed(1)} MPH`, originX+15, originY+302)
	// Clouds
	ctx.fillText(`${report.daily[0].clouds.toFixed(1)}%`, originX+140, originY+302)
}
async function loadIcon(_id,_x,_y,_sizeX,_sizeY){

	loadImage(`resources\\img\\${_id}.png`)
		.then( (img) =>{
			ctx.drawImage(img,_x,_y,_sizeX,_sizeY);
		});
}

function WordWrap(msg, max_line_length) {
	let new_msg = '';
	let temp_msg = '';
	let last_space_index = 0;
	let counter = 0;
	for(i=0; i < msg.length;i++){
		// Check if msg at current index is a space, and remember this index number
		if(msg[i] == ' '){
			last_space_index = i;
			new_msg += temp_msg;
			temp_msg = msg.at(i);
		}
		else{
			temp_msg += msg.at(i);
		}
		//Check if we've reacher the max line length
		if(counter >= max_line_length){
			new_msg += '\n';
			temp_msg = temp_msg.slice(1);
			counter = 0;
		}
		else{
			counter++;
		}
	}
	new_msg += temp_msg;
	return new_msg;
}