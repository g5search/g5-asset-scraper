const socialMap = {
    yelp_username: /(?:https?:)?\/\/(?:[A-z]+\.)?yelp.com\/biz\/([A-z0-9-]+)\/?/gm,
    facebook_username: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[\w\-]*\/)*([\w\-]*)/gm,
    twitter_username: /(?:https?:)?\/\/(?:[A-z]+\.)?twitter.com\/([A-z0-9-]+)\/?/gm,
    pinterest_username: /(?:https?:)?\/\/(?:[A-z]+\.)?pinterest.com\/([A-z0-9-]+)\/?/gm,
    instagram_username: /(?:https?:)?\/\/(?:[A-z]+\.)?instagram.com\/([A-z0-9-]+)\/?/gm,
    youtube_username: /(?:https?:)?\/\/(?:[A-z]+\.)?youtube.com\/user\/([A-z0-9-]+)\/?/gm,
    linkedin_username: /(?:https?:)?\/\/(?:[A-z]+\.)?linkedin.com\/(in|company)\/([A-z0-9-]+)\/?/gm,
    tumblr_username: /(?:https?:)?\/\/(?:[A-z]+\.)?tumblr.com\/?/gm
}

module.exports = {
  init,
  getSocialLinks,
  socialMap,
  compareLinks
}

function init (Scraper) {
  Scraper.addProp('socialLinks', {}, true)
  Scraper.addProp('socialMap', socialMap, false)
  Scraper.addScraper('afterPageChange', getSocialLinks)
}

function getSocialLinks(scraper) {
  if (scraper.template.social && scraper.template.social.selector) {
    const html = scraper.$(scraper.template.social.selector).html()
    compareLinks(html, scraper)
  } else {
    const socialLinks = scraper.$('a').toArray()
    socialLinks.forEach((anchor) => { 
      if (anchor.attribs && anchor.attribs.href) {
        compareLinks(anchor.attribs.href, scraper)
      }
    })
  }
}

function compareLinks(link, scraper) {
  for (const [key, value] of Object.entries(scraper.socialMap)) {
    if (!scraper.socialLinks[key]) {
      const matched = link.match(value)
      if (matched) {
        scraper.socialLinks[key] = matched[0]
      }
    }
  }
}