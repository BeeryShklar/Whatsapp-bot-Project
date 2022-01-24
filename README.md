# WhatsApp Bot Project - John the Legendary

## Commands

### [Language](ModulesDatabase/HandleLanguage.js)

- `Change language to [language]` - changes the language the bot receives and sends messages in.
    - For example: Change language to Hebrew.
    - This command can be used at all times in every language.
    - Languages currently supported: Hebrew, English, Arabic, French. Latin is semisupported.
- `Help` - shows the help message, which lists all the commands (except those available only to admins).

### [Filters](ModulesDatabase/HandleFilters.js)

Filters can be text, images or videos.

- `Add filter [filter] - [bot reply]` - adds a filter to the group.
    - For example: Add filter food - banana.
- `Remove filter [filter]` - removes the specified filter from the group.
    - For example: Remove filter food.
- `Edit filter [existing filter] - [new reply]` - edits the specified filter.
    - For example: Edit filter food - peach.
- `Show filters` - displays the list of all filter and their replies in the group.
- Special Tip: When adding a filter you can use `[name]` to tag someone when the filter is invoked.
    - For example: `Add filter food - [Joseph]` will make the bot tag Joseph whenever "food" is said.

### [Tags](ModulesDatabase/HandleTags.js)

- `Tag [person]` - tags someone so that they get a notification even if the group is muted on their phone.
    - For example: Tag Joseph.
- `Tag everyone` - tags all people in the group.
- `Add tag buddy [name] - [phone number in international format]` - adds the person to the list of taggable people.
    - For example: Add tagging buddy Joseph - 972501234567.
- `Remove tag buddy [name]` - removes the person from the list of taggable people.
    - For example: Remove tagging buddy Joseph.
- `Add tagging group [tagging group name] - [names of people in the group, divided by commas]` - Adds a tagging group which can be used to tag multiple people at once
  - For example: Add tagging group Banana - Moshe, Joseph, Aviram
- `Remove tagging group [tagging group name]` - removed the mentioned tagging group
- `Show tag buddies` - displays the list of all taggable people in the group
- `Check where I've been tagged` - replies to all the messages in which the author has been tagged, bringing them to the
  front of the chat.
- `Clear my tags` - clears the saved tags of the message's author.

### [Birthdays](ModulesDatabase/HandleBirthdays.js)

- `Add birthday [date in international format with periods]` - adds a birthday for message's author.
    - For example: Add birthday 1.11.2011.
- `Remove birthday` - removes the author's birthday.
- `Show birthdays` - displays the birthdays of the group members.
- `Add group to birthday message` - adds the group the message was sent in to the author's birthday message broadcast.
- `Remove group from birthday message` - removes the group the message was sent in from the author's birthday message
  broadcast.

### [Permissions](ModulesDatabase/HandlePermissions.js)

- `Define permission for [permission type] - [Admin/Regular/Muted]` - defines the permission level required for a
  certain type of commands.
  - For example: Define permission filters - Admin.
  - Permission types: filters, tags, handleShows, handleFilters, handleTags, handleBirthdays, handleOthers.
- `Mute [person tag]` - mutes the tagged person so they aren't able to use commands.
  - For example: Mute @Joseph.
- `Unmute person [person tag]` - unmutes the tagged person.
    - For example: Unmute @Joseph.
- `Show function permissions` - displays the permissions levels of the different types of commands.
- `Show people permissions` - displays the permissions levels of the people in the group.

### [Reminders](ModulesDatabase/HandleReminders.js)

All the reminder related commands work only in a private chat with the bot. The date in the commands is optional (if no
date is inputted the assumption is that the reminder is for the same date the message was written in) and can include or
not include a year.

- `Add reminder [repeat] [date] [time] [text]` - adds a reminder to the message's author.
    - For example: Add reminder 2.5.2023 7:34 Walk the cat
    - The optional parameter "repeat" creates a repeating reminder every day from the first date specified at the
      specified hour.
    - Reminders can be text, images or videos.
- `Remove reminder [date] [hour]` - deletes the reminder set at the specified time.
    - For example: Remove reminder 7:34
- `Show reminders` - Shows the author's reminders.

### [Miscellaneous Commands](ModulesImmediate)

- [`Create sticker [without cropping]`](ModulesImmediate/HandleStickers.js) - creates a sticker out of a media file and
  sends it
    - This command can be used in the message the media was sent in and as a reply to it
    - `without cropping` is an optional parameter which creates the sticker without cropping it
- [`Check Crypto`](ModulesImmediate/HandleAPIs.js) - sends a message with the exchange rates of ten different
  cryptocurrencies compared to the Dollar
- [`Internet definition [work]`](ModulesImmediate/HandleAPIs.js) - searches for the word on the website Urban Dictionary
  and returns the search result
    - For example: Internet definition chair
- [`Translate to [some language] [words]`](ModulesImmediate/HandleAPIs.js) - translates the words to the given language
  via Google Translate
    - For example: Translate to Hebrew chair
    - In the translation text only one sentence can be written due to Google Translate restrictions
- [`Download music [link to youtube]`](ModulesImmediate/HandleAPIs.js) - downloads a song from youtube and sends it as
  voice message
- [`Scan [link]`](ModulesImmediate/HandleURLs.js) - scans the given link for viruses
    - For example: Scan https://www.google.com/
    - Links can be scanned in the message the command is sent in or in a quoted message
- [`Profile`](ModulesImmediate/HandleUserStats.js) - shows the bot's information about the message's author
- [`Send link`](ModuleWebsite/HandleWebsite.js) - sends a link to the bots webpage (work in progress)
- [Create a WhatsApp survey](ModulesImmediate/HandleStickers.js):
- `Create survey Title - [survey title]
  Subtitle - [survey subtitle]
  Third Title - [third title]
  Button 1 - [first option]
  Button 2 - [second option]
  Button 3 - [third option]`
    - (The third title and buttons 1 and 2 aren't required)

<!--
### [Deletion from the database](ModulesDatabase/HandleDB.js)

- `Delete this group from the database` - deletes all of the group's information from the database.
- `Delete me from the database` - deletes all of the author's information from the database.

**Use these commands with caution, their effects are irreversible**
-->

### [Commands limited to the bot developers](ModulesDatabase/HandleAdminFunctions.js)

- `/Ban` & `/Unban` - ban a user from using the bot.
- `/Block group` & `/Unblock group` - block a group's members from using the bot.
- `Join [link to Whatsapp group]` - Invite the bot to a group via a link.
- `Ping!` - shows the total amount of groups, users, muted groups and muted users.

The bot also autotempbans groups or users who are spamming it for a short time period.

## Dependencies used

[@open-wa/wa-automate](https://www.npmjs.com/package/@open-wa/wa-automate) for the WhatsApp "link".

[mongodb](https://www.npmjs.com/package/mongodb) for storing our database.

[node-fetch](https://www.npmjs.com/package/node-fetch) for sending some requests to APIs

[node-schedule](https://www.npmjs.com/package/node-schedule) for timing the birthday checking.

[node-virustotal](https://www.npmjs.com/package/node-virustotal) for scanning links for viruses.

[util](https://www.npmjs.com/package/util) for formatting strings.

## APIs used

[CoinMarketCap](https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest) for checking cryptocurrencies
prices'

[Urban Dictionary](https://api.urbandictionary.com/v0/define?term=) for Urban dictionary.

[Google Translate](https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=query) for the
translations.

## Credits

[@ArielYat](https://github.com/ArielYat) - Ariel - Starting the project and developing the bot

[@TheBooker66](https://github.com/TheBooker66) - Ethan - developing the bot and English support

[@Arbel99](https://github.com/Arbel99) - Arbel - Latin support (whenever she feels like it)

Maayan Ranson - French Support

## RIP

- Moshe
- Aviram
- Alexander The Great