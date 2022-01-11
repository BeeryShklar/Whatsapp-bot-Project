const HDB = require("./HandleDB")

class HAF {
    static async handleUserRest(client, bodyText, chatID, messageID, quotedMsg, restUsers, restUsersCommandSpam, user) {
        if (quotedMsg) {
            let quotedMsgAuthor = quotedMsg.author
            if (bodyText.startsWith("חסום גישה למשתמש")) {
                restUsers.push(quotedMsgAuthor);
                await HDB.delArgsFromDB("restArrayUsers", null, "rested", function () {
                    HDB.addArgsToDB("restArrayUsers", restUsers, null, null, "rested", function () {
                        client.sendReplyWithMentions(chatID, "המשתמש @" + quotedMsgAuthor +
                            " נחסם בהצלחה, \n May God have mercy on your soul", messageID);
                    });
                });
            }
            if (bodyText.startsWith("אפשר גישה למשתמש")) {
                restUsers.splice(restUsers.indexOf(quotedMsgAuthor), 1);
                restUsersCommandSpam.splice(restUsersCommandSpam.indexOf(quotedMsgAuthor), 1);
                user.commandCounter = 0;
                await HDB.delArgsFromDB("restArrayUsers", null, "rested", function () {
                    HDB.addArgsToDB("restArrayUsers", restUsers, null, null, "rested", function () {
                        client.sendReplyWithMentions(chatID, "המשתמש @" + quotedMsgAuthor + " שוחרר בהצלחה", messageID);
                    });
                });
            }
        }
    }

    static async handleGroupRest(client, bodyText, chatID, messageID, restGroups, restGroupsSpam, group) {
        if (bodyText.startsWith("חסום קבוצה")) {
            restGroups.push(chatID);
            await HDB.delArgsFromDB("restArrayGroups", null, "rested", function () {
                HDB.addArgsToDB("restArrayGroups", restGroups, null, null, "rested", function () {
                    client.reply(chatID, "הקבוצה נחסמה בהצלחה", messageID);
                });
            });
        }
        if (bodyText.startsWith("שחרר קבוצה")) {
            restGroups.splice(restGroups.indexOf(chatID), 1);
            restGroupsSpam.splice(restGroupsSpam.indexOf(chatID), 1);
            group.filterCounter = 0;
            await HDB.delArgsFromDB("restArrayGroups", null, "rested", function () {
                HDB.addArgsToDB("restArrayGroups", restGroups, null, null, "rested", function () {
                    client.reply(chatID, "הקבוצה שוחררה בהצלחה", messageID);
                });
            });
        }
    }

    static async handleBotJoin(client, bodyText, chatID, messageID) {
        if (bodyText.startsWith("הצטרף לקבוצה ")) {
            const urlsInMessage = bodyText.match(/(([hH])ttps?:\/\/chat\.whatsapp\.com\/(.)+)/g);
            if (urlsInMessage) {
                try {
                    for (const url in urlsInMessage)
                        await client.joinGroupViaLink(url);
                } catch (err) {
                    await client.reply(chatID, "אני חושב שהקישור/ים לא בתוקף", messageID);
                }
            } else await client.reply(chatID, "מאסטר! הההודעה הזו לא מכילה קישור לקבוצה!", messageID);
        }
    }

    static async ping(client, bodyText, chatID, messageID, groupsDict, usersDict, restGroups, restUsers, restGroupsFilterSpam, restUsersCommandSpam) {
        if (bodyText.startsWith("/ping")) {
            const groupAmount = "כמות קבוצות סך הכל: " + Object.keys(groupsDict).length;
            const userAmount = "כמות משתמשים סך הכל: " + Object.keys(usersDict).length;
            const mutedGroups = "קבוצות מושתקות כעת: " + (restGroups.length + restGroupsFilterSpam.length);
            const mutedUsers = "משתמשים מושתקים כעת: " + (restUsers.length + restUsersCommandSpam.length);
            await client.reply(chatID, `${groupAmount}\n${userAmount}\n${mutedGroups}\n${mutedUsers}`, messageID);
        }
    }

    static async execute(client, bodyText, message, chatID, messageID, groupsDict, usersDict, restGroups, restUsers, restGroupsFilterSpam, restUsersCommandSpam, botDevs) {
        if (bodyText.startsWith("/exec")) {
            try {
                eval(bodyText.replace("/exec", ""));
                await client.reply(message.chat.id, "הפקודה שביצעת בוצעה בהצלחה", message.id);
            } catch (e) {
                await client.reply(message.chat.id, `שגיאה קרתה במהלך ביצוע הפקודה להלן השגיאה: \n ${e.toString()} `, message.id);
            }
        }
    }
}

module.exports = HAF;
