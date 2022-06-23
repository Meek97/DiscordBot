# DiscordBot
a bot for Discord. It's mostly for sending memes but also says good morning, gives daily weather updates, and posts calendar events

## How It Works:

By Using the `!submit` command, users can program the bot with a `key` word, and a `response`(in the form of an attatchment, or a URL)

Once a response is programmed, the bot scans messages for these `key` words, and if one is found it will send a corresponding `response`

Multiple `responses` can be programmed to a single `key` word. In this case, the bot will pick a response at random to send.

### A note on user privacy
* The bot *WILL* scan all messages sent in any channels that are marked for the bot to interact in.
* The bot *WILL* log when a `key` word has been triggered.
* The bot *WILL* save attatchments or links sent to it through the `!submit` command  
* The bot *WILL* save the username (*NOT* the four digit ID number) of the person that programs a response through the `!submit` command
* The bot *WILL NOT* store or log any message contents. Only the `key` words themselves are logged when a `response` is triggered

## Other Functions
#### Good Morning Gamers!
The bot can be programmed to send a "Good Morning" message to select channels at a set time each morning. Different times can be set for week days and week ends. This "Good Morning" message can include a weather report for a specific location using the OpenWeatherAPI, and can announce 'all-day' calendar events for that day

#### iCal Events
As mentioned before, the bot will announce 'all-day' events as part the "Good Morning" message, but the bot can also anounce events at a specific time from a specificed iCal address
#
## Interacting with the Bot
There are several tools to interact and monitor the bot right from your Discord Server through various commands

<sub>*for now the `submit` functionality is not a built-in slash command due to compatability with message attatchments, but could change to a slash command in the future*</sub> 
* `!submit <key word> <attatchment | URL>` : will submit the `attatchment` or `URL` as a response for the given `key` word.

* `/help` : will send a helpful message that explains how to interact with the bot
* `/revealkeys <page number | -1 for all keys>` : send a list of all the `key` words that the bot has learned. Users can use message buttons to navigate through pages, or send `-1` to display the list in it's entirety
* `/remove <key word>` : delete the given `key` word and all associate responses from the bot's database
* `/edit <key word>` : shows the user all the repsonses individualy for a given `key` word with message buttons to iterate through them, and a message button to delete the selected response from the `key` word
* `/channel` : has several sub commands that are all used to mdoerate the bot directly from Discord
  * `set_gmg <channel name> <true | false>` : enables or disables "Good Morning Gamers" message being sent in the given `channel name`
  * `set_paused <channel name> <true | false>` : enables or disables the bot interacting in the given `channel name` (the bot can not send responses, or accept submissions from a paused channel)
  * `set_responses <channel name> <true | false>` : enables or disables responses in the given `channel name`
  * `set_submissions <channel name> <true | false>` : enables or disables response submissions in the given `channel name`
  * `*status <channel name>` : shows a read-out of all the channels the bot is included in, and the status of all the above `channel` parameters for each
