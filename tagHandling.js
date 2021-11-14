const group = require("./group");
const DBH = require("./DBHandle");

class TAG{
    static async addTag(client, bodyText, chatID, messageID, groupsDict, groupMembersArray) {
        bodyText = bodyText.replace("הוסף חבר לתיוג", "");
        if (bodyText.includes("-")) {
            bodyText = bodyText.split("-");
            const tag = bodyText[0].trim();
            const phoneNumber = bodyText[1].trim();
            //make new group and insert tag + phone number  if group not in DB otherwise just insert tag and phone number
            if (!(chatID in groupsDict)) {
                groupsDict[chatID] = new group(chatID);
            }
            //check if tag exist on DB if it does return false otherwise add tag to DB
            if(groupMembersArray!=null && groupMembersArray.includes(phoneNumber+"@c.us")) {
                if (groupsDict[chatID].addTags(tag, phoneNumber)) {
                    await DBH.addArgsToDB(tag, phoneNumber, chatID, "tags", function () {
                        client.reply(chatID, "המספר טלפון של האדם " + tag + " נוסף בהצלחה", messageID);
                    });
                }
                else {
                    client.reply(chatID, "האדם " + tag + " כבר קיים במאגר של קבוצה זו", messageID);
                }
            }
            else {
                client.reply(chatID, "המספר לא קיים בקבוצה זו", messageID);
            }
        }
        else {
            client.reply(chatID, " אתה בטוח שהשתמשת במקף מר בחור?", messageID);
        }
    }
    static async remTag(client, bodyText, chatID, messageID, groupsDict) {
        bodyText = bodyText.replace("הסר חבר מתיוג", "");
        const tag = bodyText.trim();
        if (chatID in groupsDict) {
            if (groupsDict[chatID].delTags(tag)) {
                await DBH.delArgsFromDB(tag, chatID, "tags", function () {
                    client.reply(chatID, "המספר טלפון של האדם " + tag + " הוסר בהצלחה", messageID);
                });
            }
            else {
                client.reply(chatID, "רק נפוליאון יכול למחוק אנשים לא קיימים", messageID);
            }
        }
        else {
            client.reply(chatID, "אין תיוגים בקבוצה זו", messageID);
        }
    }

    static async checkTags(client, bodyText, chatID, quotedMsgID, messageID, groupsDict) {
        bodyText = bodyText.replace("תייג", "");
        bodyText = bodyText.trim();
        let splitText = bodyText.split(" ");
        let counter = 0;
        const tags = groupsDict[chatID].tags;
        for (let i = 0; i < splitText.length; i++) {
            for (const tag in tags) {
                let splitTextForChecking = splitText[i];
                if(splitText[i].charAt(0) === "ו"){
                    splitTextForChecking =  splitText[i].slice(1);
                }

                if(splitTextForChecking === tag) {
                    counter += 1;
                    bodyText = bodyText.replace(tag, "@" + tags[tag]);
                }
            }
        }
        if(counter !== 0){
            await client.sendReplyWithMentions(chatID, bodyText, quotedMsgID);
        }
        else{
            await client.reply(chatID, "האדם שאתה מנסה לתייג לא מופיע במאגר של קבוצה זו", messageID);
        }


    }
    static async showTags(client, chatID, messageID, groupsDict) {
        if (chatID in groupsDict){
            let stringForSending = "";
            let tags = groupsDict[chatID].tags;
            Object.entries(tags).forEach(([key, value]) => {
                stringForSending += key + " - " + value + "\n";
            });
            await client.reply(chatID, stringForSending, messageID);
        }
    }
}

module .exports = TAG;