import {HDB} from "./HandleDB.js";
import {HL} from "./HandleLanguage.js";

export class HT {
    static async checkTags(client, bodyText, chatID, messageID, authorID, quotedMsgID, groupsDict, usersDict) {
        bodyText = bodyText.replace(HL.getGroupLang(groupsDict, chatID, "tag"), "");
        bodyText = bodyText.trim();
        const tags = groupsDict[chatID].tags;
        let counter = 0;
        for (const tag in tags) {
            if (bodyText.includes(tag)) {
                const index = bodyText.indexOf(tag);
                if ((index <= 0 || !((/(?![ו])[A-Z\a-z\u0590-\u05fe]/).test(bodyText[index - 1]))) &&
                    (index + tag.length >= bodyText.length || !((/[A-Z\a-z\u0590-\u05fe]/).test(bodyText[index + tag.length])))) {
                    counter += 1;
                    if (typeof (tags[tag]) === "object") {
                        for (let j = 0; j < tags[tag].length; j++) {
                            if (usersDict[tags[tag][j] + "@c.us"].messagesTaggedIn[chatID] === undefined)
                                usersDict[tags[tag][j] + "@c.us"].messagesTaggedIn[chatID] = [];
                            bodyText = bodyText.substr(0, bodyText.indexOf(tag)) + " @" + tags[tag][j] + " " + tag + bodyText.substr(bodyText.indexOf(tag) + tag.length)
                            usersDict[tags[tag][j] + "@c.us"].messagesTaggedIn[chatID].push(messageID);
                            await HDB.delArgsFromDB(chatID, usersDict[tags[tag][j] + "@c.us"].personID, "lastTagged", function () {
                                HDB.addArgsToDB(chatID, usersDict[tags[tag][j] + "@c.us"].personID, usersDict[tags[tag][j] + "@c.us"].messagesTaggedIn[chatID], null, "lastTagged", function () {
                                });
                            });
                        }
                        bodyText = bodyText.replace(tag, "");
                    } else {
                        if (usersDict[tags[tag] + "@c.us"].messagesTaggedIn[chatID] === undefined)
                            usersDict[tags[tag] + "@c.us"].messagesTaggedIn[chatID] = [];
                        bodyText = bodyText.replace(tag, "@" + tags[tag]);
                        usersDict[tags[tag] + "@c.us"].messagesTaggedIn[chatID].push(messageID);
                        await HDB.delArgsFromDB(chatID, usersDict[tags[tag] + "@c.us"].personID, "lastTagged", function () {
                            HDB.addArgsToDB(chatID, usersDict[tags[tag] + "@c.us"].personID, usersDict[tags[tag] + "@c.us"].messagesTaggedIn[chatID], null, "lastTagged", function () {

                            });
                        });
                    }
                }
            }
        }
        if (counter !== 0)
            await client.sendReplyWithMentions(chatID, bodyText, quotedMsgID);
        else await client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "tag_person_doesnt_exist_error"), messageID);
    }

    static async addTag(client, bodyText, chatID, messageID, groupsDict) {
        bodyText = bodyText.replace(HL.getGroupLang(groupsDict, chatID, "add_tag"), "");
        if (bodyText.includes("-")) {
            bodyText = bodyText.split("-");
            const tag = bodyText[0].trim(),
                phoneNumber = bodyText[1].trim().match(/@?\d+/) ? bodyText[1].trim().match(/@?\d+/)[0].replace("@", "") : bodyText[1];
            const isIDEqualPersonID = (person) => phoneNumber === person.personID.replace("@c.us", "");
            if (groupsDict[chatID].personsIn != null && groupsDict[chatID].personsIn.some(isIDEqualPersonID)) {
                if (!groupsDict[chatID].doesTagExist(tag)) {
                    await HDB.addArgsToDB(chatID, tag, phoneNumber, null, "tags", function () {
                        groupsDict[chatID].tags = ["add", tag, phoneNumber];
                        client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "add_tag_reply", tag), messageID);
                    });
                } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "add_tag_already_exists_error", tag), messageID);
            } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "add_tag_doesnt_exist_error"), messageID);
        } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "hyphen_reply"), messageID);
    }

    static async remTag(client, bodyText, chatID, messageID, groupsDict) {
        bodyText = bodyText.replace(HL.getGroupLang(groupsDict, chatID, "remove_tag"), "");
        const tag = bodyText.trim();
        if (groupsDict[chatID].tags) {
            if (groupsDict[chatID].doesTagExist(tag)) {
                await HDB.delArgsFromDB(chatID, tag, "tags", function () {
                    groupsDict[chatID].tags = ["delete", tag]
                    client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "remove_tag_reply", tag), messageID);
                });
            } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "remove_tag_doesnt_exist_error"), messageID);
        } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "group_doesnt_have_tags_error"), messageID);
    }

    static async tagEveryone(client, bodyText, chatID, quotedMsgID, groupsDict) {
        bodyText = bodyText.replace(HL.getGroupLang(groupsDict, chatID, "tag_all"), "");
        let stringForSending = bodyText + "\n\n";
        Object.entries(groupsDict[chatID].personsIn).forEach(person => {
            stringForSending += "@" + person[1].personID.replace("@c.us", "") + "\n";
        });
        try {
            await client.sendReplyWithMentions(chatID, stringForSending, quotedMsgID);
        } catch (e) {
            groupsDict[chatID].personsIn = [];
            Object.entries(groupsDict[chatID].personsIn).forEach(person => {
                HDB.delArgsFromDB(chatID, person[1].personID, "personIn", function () {

                });
            });
            console.log("error occurred at tagging everyone")
        }
    }

    static async showTags(client, chatID, messageID, groupsDict) {
        if (Object.keys(groupsDict[chatID].tags).length) {
            let stringForSending = "";
            Object.entries(groupsDict[chatID].tags).forEach(([name, number]) => {
                if (typeof (number) === "object")
                    stringForSending += `${HL.getGroupLang(groupsDict, chatID, "tagged_group")}` + name + " - " + number.toString().replace(/,/g, ", ") + "\n";
                else
                    stringForSending += name + " - " + number + "\n";
            });
            await client.reply(chatID, stringForSending, messageID);
        } else await client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "group_doesnt_have_tags_error"), messageID);
    }

    static async logMessagesWithTags(bodyText, chatID, messageID, usersDict) {
        const tagsFound = bodyText.match(/@\d+/g);
        if (tagsFound) {
            for (let tag in tagsFound) {
                const ID = tagsFound[tag].replace("@", "") + "@c.us";
                if (ID in usersDict) {
                    const person = usersDict[ID];
                    if (person.messagesTaggedIn[chatID] === undefined)
                        person.messagesTaggedIn[chatID] = [];
                    person.messagesTaggedIn[chatID].push(messageID);
                    await HDB.delArgsFromDB(chatID, person.personID, "lastTagged", function () {
                        HDB.addArgsToDB(chatID, person.personID, person.messagesTaggedIn[chatID], null, "lastTagged", function () {
                        });
                    });
                }
            }
        }
    }

    static async whichMessagesTaggedIn(client, chatID, messageID, authorID, groupsDict, usersDict) {
        if (usersDict[authorID].messagesTaggedIn[chatID] !== undefined && usersDict[authorID].messagesTaggedIn[chatID].length !== 0) {
            usersDict[authorID].messagesTaggedIn[chatID].forEach(messageID =>
                client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "check_tags_reply"), messageID),
            );
            await HDB.delArgsFromDB(chatID, authorID, "lastTagged", function () {
                delete usersDict[authorID].messagesTaggedIn[chatID];
            });
        } else await client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "check_tags_no_messages_error"), messageID);
    }

    static async clearTaggedMessaged(client, chatID, messageID, authorID, groupsDict, usersDict) {
        if (usersDict[authorID].messagesTaggedIn[chatID] !== undefined && usersDict[authorID].messagesTaggedIn[chatID].length !== 0) {
            await HDB.delArgsFromDB(chatID, authorID, "lastTagged", function () {
                delete usersDict[authorID].messagesTaggedIn[chatID];
                client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "clear_tags_reply"), messageID);
            });
        } else await client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "check_tags_no_messages_error"), messageID);
    }

    static async addGroupTag(client, bodyText, chatID, messageID, groupsDict) {
        bodyText = bodyText.replace(HL.getGroupLang(groupsDict, chatID, "add_group_tag"), "");
        if (bodyText.includes("-")) {
            bodyText = bodyText.split("-");
            const tag = bodyText[0].trim(), nameArray = bodyText[1].includes(",") ? bodyText[1].split(",") : null;
            if (nameArray) {
                let phoneNumbersArray = nameArray.map(function (currentName) {
                    if (currentName.trim() in groupsDict[chatID].tags)
                        return groupsDict[chatID].tags[currentName.trim()];
                });
                phoneNumbersArray = phoneNumbersArray.filter(number => number != null);
                if (phoneNumbersArray.length > 0) {
                    if (!groupsDict[chatID].doesTagExist(tag)) {
                        await HDB.addArgsToDB(chatID, tag, phoneNumbersArray, null, "tags", function () {
                            groupsDict[chatID].tags = ["add", tag, phoneNumbersArray];
                            client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "add_group_tag_reply", tag), messageID);
                        });
                    } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "add_group_tag_already_exists_error", tag), messageID);
                } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "all_phone_numbers_in_message_arent_in_group"), messageID);
            } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "message_doesnt_contain_any_phone_numbers"), messageID);
        } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "hyphen_reply"), messageID);
    }

    static async removeGroupTag(client, bodyText, chatID, messageID, groupsDict) {
        bodyText = bodyText.replace(HL.getGroupLang(groupsDict, chatID, "remove_group_tag"), "");
        if (groupsDict[chatID].tags) {
            const tag = bodyText.trim();
            if (groupsDict[chatID].doesTagExist(tag)) {
                await HDB.delArgsFromDB(chatID, tag, "tags", function () {
                    groupsDict[chatID].tags = ["delete", tag]
                    client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "remove_group_tag_reply", tag), messageID);
                });
            } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "remove_group_tag_doesnt_exist_error"), messageID);
        } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "group_doesnt_have_tags_error"), messageID);
    }

    static async createTagList(client, bodyText, chatID, groupsDict) {
        if (groupsDict[chatID].tagStack.length === 0) {
            let matchTags = bodyText.match(/@\d+/g);
            if (!matchTags)
                await client.sendText(chatID, HL.getGroupLang(groupsDict, chatID, "create_tag_list_empty_error"));
            else {
                for (let i = 0; i < matchTags.length; i++)
                    groupsDict[chatID].addNumberToTagStack(matchTags[i]);
                groupsDict[chatID].tagStack = groupsDict[chatID].tagStack.reverse();
                await client.sendText(chatID, HL.getGroupLang(groupsDict, chatID, "create_tag_list_reply"));
            }
        }
    }

    static async nextPersonInList(client, chatID, messageID, groupsDict) {
        const tagStack = groupsDict[chatID].tagStack;
        if (tagStack.length !== 0) {
            if (tagStack.length === 1)
                await client.sendReplyWithMentions(chatID, HL.getGroupLang(groupsDict, chatID, "tag_list_last_reply", tagStack.pop()), messageID);
            else if (tagStack.length > 1)
                await client.sendReplyWithMentions(chatID, HL.getGroupLang(groupsDict, chatID, "tag_list_next_reply", tagStack.pop(), tagStack[tagStack.length - 1]), messageID)
        }
    }
}