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

const urlFromMedia = media => {
  var width = 0, height = 0;
  var url = '';

  var images = media.image_versions2; //Fetch images

  if (!images) {
    images = media.carousel_media; //Fetch images from carusel
  }

  if (!images) {
    return null;
  }

  const candidates = images.candidates;

  candidates.forEach(candidate => {
    if (candidate.width > width && candidate.height > height) {
      width = candidate.width;
      height = candidate.height;
      url = candidate.url;
    }
  });

  return url;
};

const urlsFromItems = items => {
  return items.map(item => {
    urlFromMedia(item.media)
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
      return urlsFromItems(items);
    })
    .then(urls => {
      console.log(urls);
    }).catch(err => {
      console.log(`Error: ${err}`)
    });
})();
