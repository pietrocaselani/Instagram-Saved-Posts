class SavedPost {
  constructor(webLink, caption, imagesLink, hashtags, editedcaption, mentions) {
    this.webLink = webLink;
    this.caption = caption;
    this.imagesLink = imagesLink;
    this.hashtags = hashtags;
    this.editedcaption = editedcaption;
    this.mentions = mentions;
  }
}

module.exports = SavedPost;
