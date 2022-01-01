module.exports = {
	async log(args) {
		const currentDate = new Date();
		const timeStamp = `[${currentDate.getMonth()}.${currentDate.getDate()}.${currentDate.getFullYear()}|${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}:${currentDate.getMilliseconds()}]  `;
		let logMessage = '';
		for (let i = 0; i < args.length;i++) {
			logMessage += args[i];
		}
		console.log(timeStamp + logMessage);
	},
};