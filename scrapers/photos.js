const PromisePool = require('@supercharge/promise-pool')
const cloudinary = require('../cloudinary')
const { getUniqueImageUrls } = require('../controllers/photos')

const IMAGE_REGEX = /([^="'])+\.(jpg|gif|png|jpeg)/gm

module.exports = {
  init,
  uploadPhotos,
  scrapePhotos,
  formatImageUrl
}  

/**
 * Imports lifecycle hooks.
 * @param {Object} Scraper 
 */
function init (Scraper) {
  Scraper.addProp('imageUrls', {}, true)
  Scraper.addScraper('afterPageChange', scrapePhotos)
  Scraper.addScraper('afterScrape', uploadPhotos)
}

/**
 * Adds tags, destination to Image, and uploads to Cloudinary (image host).
 * @param {Object} scraper 
 * @returns
 */
async function uploadPhotos (scraper) {
  const imageUrls = Object.keys(scraper.imageUrls)
    .map(url => formatImageUrl(url))
  const uniqueUrls = await getUniqueImageUrls(imageUrls)
  if (process.env.ENABLE_LOGGING) console.log({ msg: 'BEFORE UPLOAD', uniqueUrls })
  const uploads = uniqueUrls.map((imageUrl) => {
    const tags = [...scraper.imageUrls[imageUrl], 'Previous_Site']
    return { url: imageUrl, attribs: { folder: scraper.config.photos.folder, tags } }
  })
  const { results, errors } = await PromisePool
    .for(uploads)
    .process(async data => {
      return cloudinary.upload(data)
    })
  scraper.errors = { ...scraper.errors, imageUpload: errors }
  return results
}

/**
 * Orchestrating function to find, format, and collect image URLs.
 * @param {Object} scraper 
 */
function scrapePhotos (scraper) {
  const urls = findUniqueImageUrls(scraper)

  if (process.env.ENABLE_LOGGING) console.log({ msg: 'FORMATTED IMAGE URLS FOUND', urls })
  
  const pageUrl = scraper.url
  
  urls.forEach((url) => {
    if (!scraper.imageUrls[url]) {
      scraper.imageUrls[url] = []
    }
    scraper.imageUrls[url].push(pageUrl)
  })
}

/**
 * Detects if the scraper had issues parsing the page. Return false if parsed completely.
 * @param {Object} scraper 
 * @returns
 */
function isValidPage (scraper) {
  return typeof scraper.page === 'object' && scraper.page !== null
}

/**
 * Collects image-like URLs, dedups the list, and normalizes them.
 * @param {Object} scraper 
 * @returns
 */
function findUniqueImageUrls (scraper) {
  const urls = isValidPage(scraper) ? scraper.page.content.match(IMAGE_REGEX) : scraper.page.match(IMAGE_REGEX)

  const uniqueUrls = [...new Set(urls)]
  
  return uniqueUrls.map(url => formatImageUrl(url, scraper.rootProtocol, scraper.rootdomain))
}

/**
 * Normalizes URLs including relative URL paths to absolute.
 * @param {String} url 
 * @param {String} rootProtocol 
 * @param {String} rootdomain 
 * @returns
 */
function formatImageUrl (url, rootProtocol, rootdomain) {
  if (url.includes('url(')) {
    url = url.split('url(')[1]
  }
  if (url.includes(')')) {
    const splitUrl = url.split(/.(jpg|gif|png|jpeg)/gm)
    url = `${splitUrl[0]}.${splitUrl[1]}`
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

