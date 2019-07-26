require("dotenv").config();

const fs = require("fs");
const Promise = require("bluebird");
const SavedPost = require("./saved-post");
const Credentials = require("./credentials");

// const Client = require("instagram-private-api").V1;
const IgApiClient = require('instagram-private-api');

const username = Credentials.username;
const password = Credentials.password;

console.log(username);
console.log(password);

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

const urlsFromCandidates = candidates => {
  var width = 0, height = 0;
  var url = '';

  candidates.forEach(candidate => {
    if (candidate.width > width && candidate.height > height) {
      width = candidate.width;
      height = candidate.height;
      url = candidate.url;
    }
  });

  return url;
};

const urlsFromCarousel = carousel_media => {
  return carousel_media.map(element => {
    const x = urlsFromCandidates(element.image_versions2.candidates);
    return x;
  });
};

const urlFromMedia = media => {
  const images = media.image_versions2;

  if (!images) {
    // return null;
    const urls = urlsFromCarousel(media.carousel_media);
    return urls;
  }

  const urls = urlsFromCandidates(images.candidates);
  return urls;
};

const urlsFromItems = items => {
  return items.map(item => {
    return urlFromMedia(item.media)
  });
};

const ig = new IgApiClient.IgApiClient();

ig.state.generateDevice(username);

(async () => {
  // Execute all requests prior to authorization in the real Android application
  // Not required but recommended
  await ig.simulate.preLoginFlow();
  const loggedInUser = await ig.account.login(username, password);
  // The same as preLoginFlow()
  // Optionally wrap it to process.nextTick so we dont need to wait ending of this bunch of requests
  process.nextTick(async () => await ig.simulate.postLoginFlow());

  const savedFeed = ig.feed.saved(loggedInUser.pk);

  savedFeed.items()
    .then(items => {
      return flatten(urlsFromItems(items));
    })
    .then(urls => {
      return new Promise((resolve, reject) => {
        const path = `${__dirname}/saved_posts.json`;

        const content = JSON.stringify(urls, null, 4);

        fs.writeFile(path, content, "utf8", err => {
          if (err) {
            reject(err);
          } else {
            resolve(path);
          }
        });
      });
    }).catch(err => {
      console.log(`Error: ${err}`)
    });
})();
