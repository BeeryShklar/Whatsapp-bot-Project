const HL = require("../ModulesDatabase/HandleLanguage");

class HSu {
    static async makeButton(client, bodyText, chatID, messageID, groupsDict) {
        let buttonsArray = [];
        const titleRegex = HL.getGroupLang(groupsDict, chatID, "survey_title");
        const secondTitleRegex = HL.getGroupLang(groupsDict, chatID, "survey_subtitle");
        const thirdTitleRegex = HL.getGroupLang(groupsDict, chatID, "third_survey_title");
        const button1Regex = HL.getGroupLang(groupsDict, chatID, "survey_button_1");
        const button2Regex = HL.getGroupLang(groupsDict, chatID, "survey_button_2");
        const button3Regex = HL.getGroupLang(groupsDict, chatID, "survey_button_3");

        let title = bodyText.match(titleRegex)
        let secondTitle = bodyText.match(secondTitleRegex)
        let thirdTitle = bodyText.match(thirdTitleRegex);
        let button1 = bodyText.match(button1Regex);
        let button2 = bodyText.match(button2Regex);
        let button3 = bodyText.match(button3Regex);
        buttonsArray = this.makeButtonsArray(buttonsArray, button1, button2, button3, chatID, groupsDict);
        if (title != null && secondTitle != null && buttonsArray.length > 0) {
            title = title[0].replace(HL.getGroupLang(groupsDict, chatID, "survey_title_replace"), "").trim();
            secondTitle = secondTitle[0].replace(HL.getGroupLang(groupsDict, chatID, "second_survey_title_replace"), "").trim();
            if (thirdTitle != null) {
                thirdTitle = thirdTitle[0].replace(HL.getGroupLang(groupsDict, chatID, "third_survey_title_replace"), "").trim();
                await client.sendButtons(chatID, secondTitle, buttonsArray, title, thirdTitle);
            } else await client.sendButtons(chatID, secondTitle, buttonsArray, title);
        } else await client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "survey_creation_error"), messageID);
    }

    static makeButtonsArray(buttonsArray, button1, button2, button3, chatID, groupsDict) {
        if (button1 != null) {
            buttonsArray.push({
                id: "1",
                "text": button1[0].replace(HL.getGroupLang(groupsDict, chatID, "survey_button_1_replace"), "").trim()
            });
        }
        if (button2 != null) {
            buttonsArray.push({
                id: "1",
                "text": button2[0].replace(HL.getGroupLang(groupsDict, chatID, "survey_button_2_replace"), "").trim()
            });
        }
        if (button3 != null) {
            buttonsArray.push({
                id: "1",
                "text": button3[0].replace(HL.getGroupLang(groupsDict, chatID, "survey_button_3_replace"), "").trim()
            });
        }
        return buttonsArray;
    }
}

module.exports = HSu;