const { updateJSON } = require('./ConfigManager');

function setCommand(chatConfig, reddit, telegram) {
    return async () => {
        chatConfig.subs.forEach((sub) => {
            const options = { limit: sub.lastUpdate ? 100 : 1 };
            console.log(new Date().toLocaleString(), '| Fetching from', sub.name, options);
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
                                    setTimeout(() => {

                                        let message = `${post['subreddit_name_prefixed']}\n${post['title']}\n\nhttps://redd.it/${post['id']}`;

                                        const imageUrl = post?.preview?.images[0]?.source?.url;
                                        const videoUrl = post?.media?.reddit_video?.fallback_url;

                                        if (videoUrl) {
                                            telegram.sendVideo(chatConfig.chatId, videoUrl, { caption: message });
                                        } else if (imageUrl) {
                                            telegram.sendPhoto(chatConfig.chatId, imageUrl, { caption: message });
                                        } else {
                                            telegram.sendMessage(chatConfig.chatId, message);
                                        }

                                    }, 500 * newPosts);
                                    sub.lastUpdate = post['created_utc'];
                                    updateJSON(chatConfig);
                                }
                            }
                        });

                    console.log(
                        `${new Date().toLocaleString()} |`,
                        newPosts ? newPosts : `No recent`,
                        `posts from ${sub.name}`
                    );
                })
                .catch((e) => console.error(e));
        });
    };
}
exports.setCommand = setCommand;