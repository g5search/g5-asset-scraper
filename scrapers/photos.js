const { upload } = require("../cloudinary")

module.exports = (Scraper) => {
  Scraper.addProp('imageUrls', {})
  Scraper.addScraper('afterPageChange', scrapePhotos)
  Scraper.addScraper('afterScrape', uploadPhotos)
}
async function uploadPhotos(scraper) {
  console.log('here')
  const imageUrls = Object.keys(scraper.imageUrls)
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i]
    const tags = scraper.imageUrls[imageUrl]
    // await upload([imageUrl], { folder: 'testing', tags})
  }
}
  function scrapePhotos(scraper) {
  const urls = [...new Set(scraper.page.match(/([^="'])+\.(jpg|gif|png|jpeg)/gm)
    .map(url => formatImageUrl(url, scraper.rootProtocol, scraper.rootdomain)))]
  const pageUrl = scraper.url
  urls.forEach((url) => {
    if (!scraper.imageUrls[url]) {
      scraper.imageUrls[url] = []
    }
    scraper.imageUrls[url].push(pageUrl)
  })
}

function formatImageUrl(url, rootProtocol, rootdomain) {
  if (url.includes('(')) {
    url = url.split('(')[1]
  }
  const protocol = /^(http|https)/.test(url)
  if (protocol) {
    return url
  }
  const noProtocol = url.replace(/^\/\//, '')
  const cleanPath = noProtocol.replace(/^\//, '')
  const isDomain = /\.(com|net|org|biz|ca|info)/.test(cleanPath)
  if (isDomain) {
    return `${this.rootProtocol}://${cleanPath}`
  }
  return `${this.rootdomain}/${cleanPath}`
}