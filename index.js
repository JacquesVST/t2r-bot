const TelegramBot = require('node-telegram-bot-api');
const snoowrap = require('snoowrap');
const { SubLastUpdate } = require('./models/SubLastUpdate');
const { setCommand } = require('./engine/setCommand');
const { readJSON, updateJSON } = require('./engine/ConfigManager');
const { ChatConfig } = require('./models/ChatConfig');
require('dotenv').config();

const telegramClient = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const redditClient = new snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT,
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN
});

let command = () => {};
let chatConfig = new ChatConfig(null, 1000 * 60 * 60, []);

(() => {
    chatConfig = readJSON();
    if (chatConfig?.chatId) {
        console.log(chatConfig);
        command = setCommand(chatConfig, redditClient, telegramClient);
    }
})();

telegramClient.onText(/\/add (.+)/, (msg, match) => {
    const sub = match[1];
    chatConfig.subs.push(new SubLastUpdate(sub, null));
    updateJSON(chatConfig);
    telegramClient.sendMessage(msg.chat.id, 'Successfully added sub: r/' + sub);
});

telegramClient.onText(/\/rm (.+)/, (msg, match) => {
    const sub = match[1];
    chatConfig.subs = chatConfig.subs.filter((s) => s.name !== sub);
    updateJSON(chatConfig);
    telegramClient.sendMessage(msg.chat.id, 'Successfully removed: r/' + sub);
});

telegramClient.onText(/\/list (.+)/, (msg, match) => {
    telegramClient.sendMessage(msg.chat.id, chatConfig.subs.map((sub) => sub.name).join('\n'));
});

telegramClient.on('message', (msg) => {
    chatConfig.chatId = msg.chat.id;
    command = msg.text === 'stop' ? () => {} : setCommand(readJSON(), redditClient, telegramClient);
});

setInterval(() => {
    command();
}, chatConfig.interval);
