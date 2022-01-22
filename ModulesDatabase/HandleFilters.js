import {HDB} from "./HandleDB.js";
import {HL} from "./HandleLanguage.js";

const regex = new RegExp('\\[(.*?)\]', "g");

export class HF {
    static async checkFilters(client, bodyText, chatID, messageID, groupsDict, groupFilterLimit, restGroupsAuto) {
        const filters = groupsDict[chatID].filters;
        for (const filter in filters) {
            if (bodyText.includes(filter)) {
                const index = bodyText.indexOf(filter);
                if ((index <= 0 || !((/[A-Z\a-z\u0590-\u05fe]/).test(bodyText[index - 1]))) &&
                    (index + filter.length >= bodyText.length || !((/[A-Z\a-z\u0590-\u05fe]/).test(bodyText[index + filter.length])))) {
                    if (groupsDict[chatID].filterCounter < groupFilterLimit) {
                        if (filters[filter].startsWith("image"))
                            await client.sendImage(chatID, filters[filter].replace("image", ""), null, null, messageID);
                        else if (filters[filter].startsWith("video"))
                            await client.sendVideoAsGif(chatID, filters[filter].replace("video", ""), null, null, messageID);
                        else await client.sendReplyWithMentions(chatID, filters[filter], messageID);
                        groupsDict[chatID].filterCounter += 1;
                    } else if (groupsDict[chatID].filterCounter === groupFilterLimit) {
                        groupsDict[chatID].filterCounter += 1;
                        let bannedDate = new Date();
                        bannedDate.setMinutes(bannedDate.getMinutes() + 15);
                        bannedDate.setSeconds(0);
                        bannedDate.setMilliseconds(0);
                        groupsDict[chatID].autoBanned = bannedDate;
                        restGroupsAuto.push(chatID);
                        await client.sendText(chatID, HL.getGroupLang(groupsDict, chatID,
                            "filter_spam_reply",
                            bannedDate.getHours().toString(), bannedDate.getMinutes().toString() > 10 ?
                                bannedDate.getMinutes().toString() : "0" + bannedDate.getMinutes().toString()), messageID);
                    }
                }
            }
        }
    }

    static async addFilter(client, message, bodyText, chatID, messageID, groupsDict) {
        const messageType = message.quotedMsgObj ? message.quotedMsgObj.type : message.type;
        message = message.quotedMsgObj ? message.quotedMsgObj : message;
        bodyText = bodyText.replace(HL.getGroupLang(groupsDict, chatID, "add_filter"), "");
        let filter = bodyText.trim(), filterReply = null, existError = null;
        if (messageType === "image") {
            filterReply = "image" + await client.decryptMedia(message);
            existError = HL.getGroupLang(groupsDict, chatID, "image");
        } else if (messageType === "video") {
            filterReply = "video" + await client.decryptMedia(message);
            existError = HL.getGroupLang(groupsDict, chatID, "video");
        } else if (messageType === "chat") {
            if (bodyText.includes("-")) {
                bodyText = bodyText.split("-");
                filter = bodyText[0].trim();
                filterReply = bodyText[1].trim();
                existError = filterReply
                const regexMatch = filterReply.match(regex);
                if (regexMatch) {
                    for (let j = 0; j < regexMatch.length; j++) {
                        let testTag = regexMatch[j].replace("[", "").replace("]", "");
                        if (testTag in groupsDict[chatID].tags)
                            filterReply = filterReply.replace(regexMatch[j], "@" + groupsDict[chatID].tags[testTag]);
                    }
                }
            } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "hyphen_reply"), messageID);
        }
        if (filterReply !== null) {
            if (!groupsDict[chatID].doesFilterExist(filter)) {
                await HDB.addArgsToDB(chatID, filter, filterReply, null, "filters", function () {
                    groupsDict[chatID].filters = ["add", filter, filterReply];
                    client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "add_filter_reply", filter), messageID);
                });
            } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "add_filter_already_exists_error", filter, existError), messageID);
        }
    }

    static async remFilter(client, bodyText, chatID, messageID, groupsDict) {
        bodyText = bodyText.replace(HL.getGroupLang(groupsDict, chatID, "remove_filter"), "");
        const filter = bodyText.trim();
        if (groupsDict[chatID].filters) {
            if (groupsDict[chatID].doesFilterExist(filter)) {
                await HDB.delArgsFromDB(chatID, filter, "filters", function () {
                    groupsDict[chatID].filters = ["delete", filter];
                    client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "remove_filter_reply", filter), messageID);
                });
            } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "remove_filter_doesnt_exist_error"), messageID);
        } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "group_doesnt_have_filters_error"), messageID);
    }

    static async editFilter(client, message, bodyText, chatID, messageID, groupsDict) {
        const messageType = message.quotedMsgObj ? message.quotedMsgObj.type : message.type;
        message = message.quotedMsgObj ? message.quotedMsgObj : message;
        bodyText = bodyText.replace(HL.getGroupLang(groupsDict, chatID, "edit_filter"), "");
        let filter = bodyText.trim(), filterReply = null;
        if (messageType === "image")
            filterReply = "image" + await client.decryptMedia(message);
        else if (messageType === "video")
            filterReply = "video" + await client.decryptMedia(message);
        else if (messageType === "chat") {
            if (bodyText.includes("-")) {
                bodyText = bodyText.split("-");
                filter = bodyText[0].trim();
                filterReply = bodyText[1].trim();
                if (groupsDict[chatID].filters) {
                    let regexTemp = filterReply.match(regex);
                    if (regexTemp != null) {
                        for (let j = 0; j < regexTemp.length; j++) {
                            let regexTempTest = regexTemp[j].replace("[", "");
                            regexTempTest = regexTempTest.replace("]", "");
                            if (regexTempTest in groupsDict[chatID].tags)
                                filterReply = filterReply.replace(regexTemp[j], "@" + groupsDict[chatID].tags[regexTempTest]);
                        }
                    }
                }
            } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "hyphen_reply"), messageID);
        }
        if (filterReply !== null) {
            if (groupsDict[chatID].doesFilterExist(filter)) {
                await HDB.delArgsFromDB(chatID, filter, "filters", function () {
                    HDB.addArgsToDB(chatID, filter, filterReply, null, "filters", function () {
                        groupsDict[chatID].filters = ["edit", filter, filterReply]
                        client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "edit_filter_reply", filter), messageID);
                    });
                });
            } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "edit_filter_not_existent_error"), messageID);
        }
    }

    static async showFilters(client, chatID, messageID, groupsDict) {
        if (Object.keys(groupsDict[chatID].filters).length) {
            let stringForSending = "";
            let filters = groupsDict[chatID].filters;
            Object.entries(filters).forEach(([filter, filterReply]) => {
                if (filterReply.startsWith("image"))
                    stringForSending += filter + " - " + HL.getGroupLang(groupsDict, chatID, "image") + "\n";
                else if (filterReply.startsWith("video"))
                    stringForSending += filter + " - " + HL.getGroupLang(groupsDict, chatID, "video") + "\n";
                else stringForSending += filter + " - " + filterReply + "\n";
            });
            await client.reply(chatID, stringForSending, messageID);
        } else await client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "group_doesnt_have_filters_error"), messageID);
    }
}