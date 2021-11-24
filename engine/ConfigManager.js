const fs = require('fs');
const { ChatConfig } = require('../models/ChatConfig');

function readJSON() {
    try {
        let fileData = JSON.parse(readConfigFile());
        return new ChatConfig(fileData['chatId'], fileData['interval'] || 1000 * 60 * 60, fileData['subs']);
    } catch {
        return new ChatConfig(null, 1000 * 60 * 60, []);
    }
}

function readConfigFile() {
    return fs.readFileSync('chat_config.json');
}

function updateJSON(chatConfig) {
    fs.writeFile('chat_config.json', JSON.stringify(chatConfig), (err) => {
        if (err) throw err;
    });
}

exports.readJSON = readJSON;
exports.updateJSON = updateJSON;
