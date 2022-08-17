module.exports = {
	async log(args) {
		const currentDate = new Date();
		const timeStamp = `[${(currentDate.getMonth() + 1).toString().padStart(2,'0')}.${currentDate.getDate().toString().padStart(2,'0')}.${currentDate.getFullYear()}|${currentDate.getHours().toString().padStart(2,'0')}:${currentDate.getMinutes().toString().padStart(2,'0')}:${currentDate.getSeconds().toString().padStart(2,'0')}:${currentDate.getMilliseconds().toString().padStart(3,'0')}]  `;
		let logMessage = '';
		for (let i = 0; i < args.length;i++) {
			logMessage += args[i];
		}
		console.log(timeStamp + logMessage);
	},
};