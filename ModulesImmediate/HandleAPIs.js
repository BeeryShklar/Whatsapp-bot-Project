const HL = require("../ModulesDatabase/HandleLanguage"), apiKeys = require("../apiKeys.js");
const nodeFetch = require("node-fetch"), request = require("request");

class HAPI {
    static async fetchCryptocurrency(client, chatID, messageID, groupsDict) {
        const apiKey = apiKeys.cryptoAPI;
        if (!groupsDict[chatID].cryptoCheckedToday) {
            try {
                let response = await nodeFetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
                    method: 'GET', headers: {
                        'X-CMC_PRO_API_KEY': apiKey, 'Accept': 'application/json'
                    },
                });
                response = await response.json();
                let stringForSending = "";
                for (let i = 0; i < 10; i++) stringForSending += `1 [${response.data[i].symbol}] = ${response.data[i].quote.USD.price.toFixed(3)}$\n`;
                groupsDict[chatID].cryptoCheckedToday = true;
                client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "crypto_check_reply", stringForSending), messageID);
            } catch (err) {
                client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "crypto_api_error"), messageID);
            }
        } else client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "crypto_limit_error"), messageID);
    }

    static async searchUrbanDictionary(client, bodyText, chatID, messageID, groupsDict) {
        bodyText = bodyText.replace(HL.getGroupLang(groupsDict, chatID, "search_in_urban"), "").trim();
        try {
            const url = `https://api.urbandictionary.com/v0/define?term=${bodyText}`;
            let response = await nodeFetch(url, {
                method: 'GET', headers: {
                    'Accept': 'application/json'
                },
            });
            response = await response.json();
            let stringForSending = "";
            if (response.list.length !== 0) {
                for (let i = 0; i < response.list.length && i < 10; i++) stringForSending += `*${HL.getGroupLang(groupsDict, chatID, "search_in_urban_reply")} ${i + 1}:* \n ${response.list[i].definition} \n Definition by: ${response.list[i].author} \n\n`;
                await client.reply(chatID, stringForSending, messageID);
            } else await client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "search_in_urban_error"), messageID);
        } catch (err) {
            client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "search_in_urban_error"), messageID);
        }
    }

    static async translate(client, bodyText, chatID, messageID, groupsDict) {
        if (groupsDict[chatID].translationCounter < 10) {
            bodyText = bodyText.replace(HL.getGroupLang(groupsDict, chatID, "translate_to"), "").trim();
            const textToTranslate = bodyText.replace(bodyText.split(" ")[0], "").trim();
            const url = encodeURI(`https://en.wikipedia.org/w/api.php?action=languagesearch&search=${bodyText.split(" ")[0]}&format=json`);
            let langResponse = await nodeFetch(url, {
                method: 'GET', headers: {
                    'Accept': 'application/json'
                },
            });
            langResponse = await langResponse.json();
            let langCode = Object.keys(langResponse.languagesearch)[0];
            if (langCode) {
                const url = encodeURI(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${textToTranslate}`);
                request.get(url, async function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        const response = body.split('"');
                        await client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "translate_reply", response[1], response[response.length - 2]), messageID);
                        groupsDict[chatID].translationCounter++;
                    } else await client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "translate_language_google_error"), messageID);
                }, null);
            } else await client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "translate_language_error"), messageID);
        } else await client.reply(chatID, HL.getGroupLang(groupsDict, chatID, "translate_language_limit"), messageID);
    }
}

module.exports = HAPI;
