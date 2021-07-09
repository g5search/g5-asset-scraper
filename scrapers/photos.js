const asyncPool = require('tiny-async-pool')
const cloudinary = require('../cloudinary')

const concurrency = 10

module.exports = {
  init,
  uploadPhotos,
  scrapePhotos,
  formatImageUrl
}  

function init (Scraper) {
  Scraper.addProp('imageUrls', {}, true)
  Scraper.addScraper('afterPageChange', scrapePhotos)
  Scraper.addScraper('afterScrape', uploadPhotos)
}

async function uploadPhotos (scraper) {
  const imageUrls = Object.keys(scraper.imageUrls)
  const uploads = []
  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const imageUrl = imageUrls[i]
      const tags = [...scraper.imageUrls[imageUrl], 'Previous_Site']
      uploads.push({ url: imageUrl, attribs: { folder: scraper.config.photos.folder, tags } })
    } catch (error) {
      console.log(error)
    }
  }

  return asyncPool(concurrency, uploads, cloudinary.upload)
}

function scrapePhotos (scraper) {
  const urls = [...new Set(scraper.page.match(/([^="'])+\.(jpg|gif|png|jpeg)/gm)
    .map(url => formatImageUrl(url, scraper.rootProtocol, scraper.rootdomain)))
  ]
  const pageUrl = scraper.url
  urls.forEach((url) => {
    if (!scraper.imageUrls[url]) {
      scraper.imageUrls[url] = []
    }
    scraper.imageUrls[url].push(pageUrl)
  })
}

function formatImageUrl (url, rootProtocol, rootdomain) {
  if (url.includes('url(')) {
    url = url.split('url(')[1]
  }
  if (url.includes(')')) {
    url = url.split(')')[0]
  }
  const protocol = /^(http|https)/.test(url)
  if (protocol) {
    return url
  }
  const noProtocol = url.replace(/^\/\//, '')
  const cleanPath = noProtocol.replace(/^\//, '')
  const isDomain = /\.(com|net|org|biz|ca|info)/.test(cleanPath)
  if (isDomain) {
    return `${rootProtocol}://${cleanPath}`
  }
  return `${rootProtocol}://${rootdomain}/${cleanPath}`
}
