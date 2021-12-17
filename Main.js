//Files for the different modules
const HDB = require("./ModulesDatabase/HandleDB"), HL = require("./ModulesDatabase/HandleLanguage"),
    HURL = require("./ModulesImmediate/HandleURLs"), HF = require("./ModulesDatabase/HandleFilters"),
    HT = require("./ModulesDatabase/HandleTags"), HB = require("./ModulesDatabase/HandleBirthdays"),
    HSi = require("./ModulesImmediate/HandleStickers"), HSu = require("./ModulesImmediate/HandleSurveys"),
    HAF = require("./ModulesMiscellaneous/HandleAdminFunctions"), Strings = require("./Strings.js").strings;
//Whatsapp API module
const wa = require("@open-wa/wa-automate");
//Schedule module and its configuration
const schedule = require('node-schedule');
const rule = new schedule.RecurrenceRule();
rule.tz = 'Israel'; //Time zone

//TODO: add something to the bot's about section
//TODO: add a function to reset a group's DB
//TODO: add function to allow select users of a group to modify it's DB
//TODO: add an option for a private link in a user's DMs to modify info in the group's DB
//TODO: add cleaner function for groups that don't exist anymore
//Local storage of data to not require access to the database at all times (cache)
let groupsDict = {}, restUsers = [], restGroups = [], restGroupsSpam = [];
//Group rest intervals
const groupCommandResetInterval = 20 * 60 * 1000 //When to reset the filter counter (in ms)
const groupRestResetInterval = 5 * 60 * 1000; //When to reset the groups muted (in ms)
const limitFilter = 15; //Filter Limit

//Start the bot - get all the groups from mongoDB and make an instance of every group object in every group
await HDB.GetAllGroupsFromDB(groupsDict, async function () {
    await wa.create({headless: false, multiDevice: true}).then(client => start(client));
});

/*
Handle filters - add filter, remove filter, edit filters, show filters and respond to filter
Input: client and message
Output: None
*/
async function handleFilters(client, bodyText, chatID, messageID) {
    let filterRelated;
    if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "add_filter"))) { //Handle add filter
        await HF.addFilter(client, bodyText, chatID, messageID, groupsDict, limitFilter, restGroupsSpam);
        filterRelated = true;
    } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "remove_filter"))) { //Handle remove filter
        await HF.remFilter(client, bodyText, chatID, messageID, groupsDict, limitFilter, restGroupsSpam);
        filterRelated = true;
    } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "edit_filter"))) { //Handle edit filter
        await HF.editFilter(client, bodyText, chatID, messageID, groupsDict, limitFilter, restGroupsSpam);
        filterRelated = true;
    } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "show_filters"))) { //Handle show filters
        await HF.showFilters(client, chatID, messageID, groupsDict);
        filterRelated = true;
    } else filterRelated = false;
    return filterRelated;
}

/*
Handle tags - add tag, remove tag, tag persons, tag everyone and show tags
Input: client and message
Output: None
*/
async function handleTags(client, bodyText, chatID, messageID, quotedMsgID, groupMembersArray) { //TODO: add function to check where a user was last tagged
    let tagRelated;
    if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "tag"))) { //Handle tag someone
        await HT.checkTags(client, bodyText, chatID, messageID, quotedMsgID, groupsDict);
        tagRelated = true;
    } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "tag_all"))) { //Handle tag everyone
        await HT.tagEveryOne(client, bodyText, chatID, messageID, quotedMsgID, groupsDict);
        tagRelated = true;
    } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "add_tag"))) { //Handle add tag
        await HT.addTag(client, bodyText, chatID, messageID, groupsDict, groupMembersArray);
        tagRelated = true;
    } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "remove_tag"))) { //Handle remove tag
        await HT.remTag(client, bodyText, chatID, messageID, groupsDict);
        tagRelated = true;
    } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "show_tags"))) { //Handle show tags
        await HT.showTags(client, chatID, messageID, groupsDict);
        tagRelated = true;
    } else tagRelated = false;
    return tagRelated;
}

/*
Handle birthdays - add birthday, remove birthday and show birthdays
Input: client and message
Output: None
*/
async function handleBirthdays(client, bodyText, chatID, messageID) {
    let birthdayRelated
    if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "add_birthday"))) { //Handle add birthday
        await HB.addBirthday(client, bodyText, chatID, messageID, groupsDict);
        birthdayRelated = true;
    } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "remove_birthday"))) { //Handle remove birthday
        await HB.remBirthday(client, bodyText, chatID, messageID, groupsDict);
        birthdayRelated = true;
    } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "show_birthDays"))) { //Handle show birthdays
        await HB.showBirthdays(client, chatID, messageID, groupsDict);
        birthdayRelated = true;
    } else birthdayRelated = false;
    return birthdayRelated
}

/*
Handle tags - change language and show help
Input: client and message
Output: None
*/
async function handleLanguage(client, bodyText, chatID, messageID) {
    let languageRelated;
    if (bodyText.startsWith(Strings["change_language"]["he"]) ||
        bodyText.startsWith(Strings["change_language"]["en"]) ||
        bodyText.startsWith(Strings["change_language"]["la"])) { //Handle change language
        await HL.changeGroupLang(client, bodyText, chatID, messageID, groupsDict);
        languageRelated = true;
    } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "help"))) { //Handle show help
        await client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "help_reply"), messageID);
        languageRelated = true;
    } else languageRelated = false;
    return languageRelated;
}

//Reset filter counter for all groups every [groupCommandResetInterval] minutes (automatic)
setInterval(function () {
    for (let group in groupsDict)
        groupsDict[group].filterCounter = 0;
}, groupCommandResetInterval);

//Remove all groups from rest list every [groupRestResetInterval] minutes (automatic)
setInterval(function () {
    while (restGroupsSpam.length > 0)
        restGroupsSpam.pop();
}, groupRestResetInterval);

//Main function
function start(client) {
    schedule.scheduleJob('4 0 * * *', () => { //Check if there are birthdays everyday at 4 am
        HB.checkBirthdays(client, groupsDict)
    });
    //Sends a starting help message when added to a group
    client.onAddedToGroup().then(async chat => {
        await client.sendText(chat.id,
            `שלום, אני אלכס!` +
            `\nכדי לשנות שפה כתבו "שנה שפה ל־[שפה שאתם רוצים לשנות לה]".` +
            `\nהשפה בררת המחדל היא עברית, והשפות האפשריות כעת הן עברית, אנגלית ולטינית.` +
            `\nכדי להציג את הודעת העזרה כתבו "הראה עזרה" בשפה הפעילה.` +

            `\n\n\nHello, I'm Alex!` +
            `\nTo change my language type "Change language to [language you want to change to]".` +
            `\nThe default language is Hebrew, and the currently available languages are Hebrew, English and Latin.` +
            `\nTo display a help message type "Show help" in the active language.` +

            `\n\n\nSalve amici, Alex sum!` +
            `\nMea lingua mutatum, scriba "Muta lingua ad [lingua quam desideras]".` +
            `\nLingua Hebraica defalta est, et in sistema Linguae Anglica et Latina sunt.` +
            `\nPropter auxilium, scriba "Ostende auxilium" in mea lingua.`)
    });
    //Check every function every time a message is received
    client.onMessage().then(async message => {
        if (message != null) {
            let bodyText
            if (message.body !== null && typeof message.body === "string")
                bodyText = message.body;
            else
                bodyText = message.caption;
            const chatID = message.chat.id, messageID = message.id, messageAuthor = message.author,
                messageType = message.type;
            let quotedMsgID = null, quotedMsgAuthor = null, groupMembersArray = null;
            if (message.quotedMsg) {
                quotedMsgID = message.quotedMsg.id;
                quotedMsgAuthor = message.quotedMsg.author;
            }
            if (message.chat.isGroup)
                groupMembersArray = await client.getGroupMembersId(message.chat.id);

            //Handle user rest by an admin
            await HAF.handleUserRest(client, bodyText, chatID, messageID, messageAuthor, quotedMsgID, quotedMsgAuthor, restUsers);
            //Handle group rest by an admin
            await HAF.handleGroupRest(client, bodyText, chatID, messageID, messageAuthor, restGroups, restGroupsSpam);
            //Handle sending links to the bot by an admin
            await HAF.handleBotJoin(client, bodyText, chatID, messageID, messageAuthor);
                 //If both the user who sent the message and group the message was sent in are allowed, proceed to the functions
            if (!restUsers.includes(messageAuthor) && !restGroups.includes(chatID) &&
                !restGroupsSpam.includes(chatID)) {
                await HF.checkFilters(client, bodyText, chatID, messageID, groupsDict, limitFilter, restGroupsSpam)
                if (await handleFilters(client, bodyText, chatID, messageID)) { //Handle filters
                } else if (await handleTags(client, bodyText, chatID, messageID, quotedMsgID, groupMembersArray)) { //Handle tags
                } else if (await handleBirthdays(client, bodyText, chatID, messageID)) { //Handle birthdays
                } else if (await handleLanguage(client, bodyText, chatID, messageID)) { //Handle language and help
                } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "make_sticker"))) { //Handle stickers
                    await HSi.handleStickers(client, message, chatID, messageID, messageType, groupsDict);
                } else if (bodyText.includes(HL.getGroupLang(groupsDict, chatID, "scan_link"))) {//Handle URLs
                    await HURL.stripLinks(client, bodyText, chatID, messageID, groupsDict);
                } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "create_survey"))) { //Handle surveys
                    await HSu.makeButton(client, bodyText, chatID, messageID, groupsDict);
                } else if (bodyText.startsWith(HL.getGroupLang(groupsDict, chatID, "show_webpage")))
                    await client.sendText(chatID, HL.getGroupLang(groupsDict, chatID, "show_webpage_reply"));
            }
        }
    });
}
