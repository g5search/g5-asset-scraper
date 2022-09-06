const PromisePool = require('@supercharge/promise-pool')
const cloudinary = require('../cloudinary')
const { getUniqueImageUrls } = require('../controllers/photos')
// const concurrency = 10

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
  // return asyncPool(concurrency, uploads, tryCatchUpload)
}

function scrapePhotos (scraper) {
  const urls = (typeof scraper.page === 'object' && scraper.page !== null)
    ? [...new Set(scraper.page.content.match(/([^="'])+\.(jpg|gif|png|jpeg)/gm)
      .map(url => formatImageUrl(url, scraper.rootProtocol, scraper.rootdomain)))
    ]
    : [...new Set(scraper.page.match(/([^="'])+\.(jpg|gif|png|jpeg)/gm)
      .map(url => formatImageUrl(url, scraper.rootProtocol, scraper.rootdomain)))
    ]

  if (process.env.ENABLE_LOGGING) console.log({ msg: 'FORMATTED IMAGE URLS FOUND', urls })
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

