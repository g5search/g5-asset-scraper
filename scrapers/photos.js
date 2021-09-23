const PromisePool = require('@supercharge/promise-pool')
const cloudinary = require('../cloudinary')
const probeImgSize = require('probe-image-size')

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
    const imageUrl = imageUrls[i]
    const tags = [...scraper.imageUrls[imageUrl], 'Previous_Site']
    uploads.push({ url: imageUrl, attribs: { folder: scraper.config.photos.folder, tags } })
  }

  // const { results, errors } = await PromisePool
  // .for(uploads)
  // .process(async data => {
  //   return cloudinary.upload(data)
  // })
  // scraper.errors = { ...scraper.errors, imageUpload: errors }
  // return results
  return {}
  // return asyncPool(concurrency, uploads, tryCatchUpload)
}

function scrapePhotos (scraper) {
  const pictures = resolvePictureSet(scraper)
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

async function resolvePictureSet (scraper) {
  const res = new Array()
  const pictures = scraper.$('picture')
  for (let i = 0; i < pictures.length; i++) {
    if (pictures[i].children.length > 1) {
      const srcs = pictures[i].children.filter(p => p.name === 'source')
      if (srcs.length) {
        res.push([])
      }
      for (let src of srcs) {
        if (src.attribs) {
          if (src.attribs.srcset) {
            res[i].push(src.attribs.srcset)
          }
          if (src.attribs['data-srcset']) {
            res[i].push(src.attribs['data-srcset'])
          }
        }
      }
    }
    await sortSize(res[i])
  }
  // console.log(res)
  return res
}

async function sortSize (imgs) {
  const keep = new Map()
  const discard = []
  if (Array.isArray(imgs) && imgs.length > 1) {
      for (const img of imgs) {
        const formatted = formatImageUrl(img)
        const width = await probeImgSize(formatted)
          .then(res => res.width)
          .catch(() => discard.push(img))
        keep.set(formatted, width)
      }
  }
  console.log(keep)
  return keep
}
function resolveImgSrcSet (node) {}

function rejectStructuredDataUrls (context) {}