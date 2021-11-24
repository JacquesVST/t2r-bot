const { updateJSON } = require('./ConfigManager');

function setCommand(chatConfig, reddit, telegram) {
    return async () => {
        chatConfig.subs.forEach((sub) => {
            const options = { limit: sub.lastUpdate ? 100 : 1 };
            console.log(new Date().toISOString() + ' | Fetching from ' + sub.name, options);
            reddit
                .getSubreddit(sub.name)
                .getNew(options)
                .then((posts) => {
                    let newPosts = 0;
                    posts
                        .sort((a, b) => a['created_utc'] - b['created_utc'])
                        .forEach((post) => {
                            if (post) {
                                if (!sub.lastUpdate || post['created_utc'] > sub.lastUpdate) {
                                    newPosts++;

                                    let message = `${post['subreddit_name_prefixed']}\n${post['title']}\n\nhttps://reddit.com${post['permalink']}`;

                                    const imageUrl = post?.preview?.images[0]?.source?.url;
                                    if (imageUrl) {
                                        telegram.sendPhoto(chatConfig.chatId, imageUrl, { caption: message });
                                    } else {
                                        telegram.sendMessage(chatConfig.chatId, message);
                                    }

                                    sub.lastUpdate = post['created_utc'];
                                    updateJSON(chatConfig);
                                }
                            }
                        });

                    console.log(
                        `${new Date().toISOString()} | ` +
                            (newPosts === 0
                                ? `No recent posts from ${sub.name}`
                                : `${newPosts}  posts from ${sub.name}`)
                    );
                })
                .catch((e) => console.error(e));
        });
    };
}
exports.setCommand = setCommand;
