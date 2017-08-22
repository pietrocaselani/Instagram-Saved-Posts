require('dotenv').config()

const fs = require('fs');
const Promise = require('bluebird');
const SavedPost = require('./saved-post');

const Client = require('instagram-private-api').V1;

const username = 'insert your username here';
const password = 'insert your password here';

const device = new Client.Device(username);
const storage = new Client.CookieMemoryStorage();

Client.Session.create(device, storage, username, password)
	.then(function(session) {
        return new Client.Feed.SavedMedia(session, 100).all();
	})
	.then(posts => {
        const savedPosts = posts.map((post) => {
            const webLink = post.params.webLink;
            const caption = post.params.caption;
            const imagesLink = post.params.images.map((image => {
                return image.url;
            }))

            return new SavedPost(webLink, caption, imagesLink)
        });

        return new Promise((resolve, reject) => {
            const path = __dirname + '/saved_posts.json'

            const content = JSON.stringify(savedPosts, null, 4);

            fs.writeFile(path, content, 'utf8', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(path);
                }
            });
        })
    })
    .then(path => {
        console.log(`File saved at ${path}`);
    })
    .catch(err => {
        console.log(err);
    })