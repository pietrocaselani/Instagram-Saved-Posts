require("dotenv").config();

const fs = require("fs");
const Promise = require("bluebird");
const SavedPost = require("./saved-post");

const Client = require("instagram-private-api").V1;

const username = "";
const password = "";

const device = new Client.Device(username);
const storage = new Client.CookieMemoryStorage();

const flatten = ary => {
  let ret = [];
  for (let i = 0; i < ary.length; i += 1) {
    if (Array.isArray(ary[i])) {
      ret = ret.concat(flatten(ary[i]));
    } else {
      ret.push(ary[i]);
    }
  }
  return ret;
};

Client.Session.create(device, storage, username, password)
  .then(session => {
    return new Client.Feed.SavedMedia(session, 100).all();
  })
  .then(posts => {
    const savedPosts = posts.map(post => {
      const { webLink, caption } = post.params;

      const findImagesUrl = obj => {
        if (Array.isArray(obj)) {
          return obj.map(o => {
            return findImagesUrl(o);
          });
        }
        return obj.url;
      };

      let imagesLink = flatten(findImagesUrl(post.params.images));

      imagesLink = imagesLink.filter((obj, index) => {
        return index % 2 === 0;
      });

      var tokens = [];

      if (caption) {
        tokens = caption.split(" ");
      }

      let hashtags = [];
      let words = [];
      let mentions = [];
      let current = 0;
      let prev = -1;
      let next = 1;
      for (token of tokens) {
        if (token[0] == "#") {
          hashtags.push(token);
        } else if (token[0] == "@") {
          mentions.push(token);
        } else {
          words.push(token);
        }
        current++;
        prev++;
        next++;
      }

      return new SavedPost(
        webLink,
        caption,
        imagesLink,
        hashtags.join(" "),
        words.join(" "),
        mentions.join(" ")
      );
    });

    return new Promise((resolve, reject) => {
      const path = `${__dirname}/saved_posts.json`;

      const content = JSON.stringify(savedPosts, null, 4);

      fs.writeFile(path, content, "utf8", err => {
        if (err) {
          reject(err);
        } else {
          resolve(path);
        }
      });
    });
  })
  .then(path => {
    console.log(`File saved at ${path}`);
  })
  .catch(err => {
    console.log(err);
  });
