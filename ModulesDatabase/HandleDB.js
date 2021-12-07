const group = require("../Group");
const MongoClient = require('mongodb').MongoClient, url = "mongodb://localhost:27017/";

class HDB {
    static async addArgsToDB(key, value1, value2, value3, ID, filterOrTagsOrBirthday, callback) {
        let objectToAddToDataBase = null;
        MongoClient.connect(url, function (err, db) {
            if (err) {
                console.log(err + "addArgsToDB");
                return;
            }
            const dbo = db.db("WhatsappBotDB");
            if (filterOrTagsOrBirthday === "filters") {
                objectToAddToDataBase = {ID: ID, filter: key, filter_reply: value1};
            } else if (filterOrTagsOrBirthday === "tags") {
                objectToAddToDataBase = {ID: ID, name: key, phone_number: value1};
            } else if (filterOrTagsOrBirthday === "birthday") {
                objectToAddToDataBase = {ID: ID, name: key, birthDay: value1, birthMonth: value2, birthYear: value3};
            } else if (filterOrTagsOrBirthday === "lang") {
                objectToAddToDataBase = {ID: ID, lang: key};
            }
            dbo.collection(filterOrTagsOrBirthday + "-groups").insertOne(objectToAddToDataBase, function (err, res) {
                if (err) {
                    console.log(err + "addArgsToDB-insertOne");
                    return;
                }
                callback();
                db.close();
            });
        });
    }

    static async delArgsFromDB(key, ID, filterOrTagsOrBirthday, callback) {
        let objectToDelToDataBase = null;
        MongoClient.connect(url, function (err, db) {
            if (err) {
                console.log(err + "delArgsFromDB");
                return;
            }
            const dbo = db.db("WhatsappBotDB");
            if (filterOrTagsOrBirthday === "filters") {
                objectToDelToDataBase = {ID: ID, filter: key};
            } else if (filterOrTagsOrBirthday === "tags") {
                objectToDelToDataBase = {ID: ID, name: key};
            } else if (filterOrTagsOrBirthday === "birthday") {
                objectToDelToDataBase = {ID: ID, name: key};
            } else if (filterOrTagsOrBirthday === "lang") {
                objectToDelToDataBase = {ID: ID};
            }
            dbo.collection(filterOrTagsOrBirthday + "-groups").deleteOne(objectToDelToDataBase, function (err, res) {
                if (err) {
                    console.log(err + "delArgsFromDB-deleteOne");
                    return;
                }
                callback();
                db.close();
            });
        });
    }

    static async GetAllGroupsFromDB(groupsDict, callback) {
        function makeGroupID(document) {
            let ID = document.ID;
            let name = document.name;
            let phone_number = document.phone_number;
            if (ID in groupsDict) {
                groupsDict[ID].addTag(name, phone_number);
            } else {
                groupsDict[ID] = new group(ID);
                groupsDict[ID].addTag(name, phone_number);
            }
        }

        function makeGroupFilter(document) {
            let ID = document.ID;
            let filter = document.filter;
            let filter_reply = document.filter_reply;
            if (ID in groupsDict) {
                groupsDict[ID].addFilter(filter, filter_reply);
            } else {
                groupsDict[ID] = new group(ID);
                groupsDict[ID].addFilter(filter, filter_reply);
            }
        }

        function makeGroupBirthday(document) {
            let ID = document.ID;
            let name = document.name;
            let birthDay = document.birthDay;
            let birthMonth = document.birthMonth;
            let birthYear = document.birthYear;
            if (ID in groupsDict) {
                groupsDict[ID].addBirthday(name, birthDay, birthMonth, birthYear);
            } else {
                groupsDict[ID] = new group(ID);
                groupsDict[ID].addBirthday(name, birthDay, birthMonth, birthYear);
            }
        }

        function makeGroupLang(document) {
            let ID = document.ID;
            let lang = document.lang;
            if (ID in groupsDict) {
                groupsDict[ID].changeLang(lang);
            } else {
                groupsDict[ID] = new group(ID);
                groupsDict[ID].changeLang(lang);
            }
        }

        MongoClient.connect(url, function (err, db) {
            if (err) {
                console.log(err + "addArgsToDB");
                return;
            }
            const dbo = db.db("WhatsappBotDB");
            dbo.collection("tags-groups").find({}).toArray(function (err, result) {
                if (err) {
                    console.log(err + "addArgsToDB-tags-find");
                    return;
                }
                for (let i = 0; i < result.length; i++) {
                    makeGroupID(result[i]);
                }
            });
            dbo.collection("filters-groups").find({}).toArray(function (err, result) {
                if (err) {
                    console.log(err + "addArgsToDB-filters-find");
                    return;
                }
                for (let i = 0; i < result.length; i++) {
                    makeGroupFilter(result[i]);
                }
                callback(groupsDict);
            });
            dbo.collection("birthday-groups").find({}).toArray(function (err, result) {
                if (err) {
                    console.log(err + "addArgsToDB-birthday-find");
                    return;
                }
                for (let i = 0; i < result.length; i++) {
                    makeGroupBirthday(result[i]);
                }
            });
            dbo.collection("lang-groups").find({}).toArray(function (err, result) {
                if (err) {
                    console.log(err + "lang-find");
                    return;
                }
                for (let i = 0; i < result.length; i++) {
                    makeGroupLang(result[i]);
                }
                db.close();
            });
        });
    }
}

module.exports = HDB;