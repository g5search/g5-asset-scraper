const axios = require('axios')
const { imageFromBuffer } = require('@canvas/image')
const { hash } = require('./imageHashing')

/**
 * Deduplicates array of image urls by file name and image 
 * render returning lategest images when duplicates are found
 * @param {Array} images - array of image urls
 * @returns {Array} - returns an array of url 
 */
const getUniqueImageUrls = async (imageUrls) => {
  const uniqueImageMap = await _dedupeByFileName(imageUrls)
  const imgMap = await _dedupeByImageRender(uniqueImageMap)
  const uniqueImages = []
  for (let [key, value] of imgMap) {
    uniqueImages.push(value.url)
  }
  return uniqueImages
}

/**
 * De deplicates array of image urls by file name
 * returning largest version of image when duplicates are found
 * @param {Array<String>} images
 * @returns {Map<String,Object>} - map of image names to image objects
 */
const _dedupeByFileName = async (images) => {
  const imageMap = new Map()
  const imageObjects = await _getImageObjects(images)
  for(let i = 0; i < imageObjects.length; i++) {
    const imgObj = imageObjects[i]
    if (imgObj) {
      const imgKey = imgObj.url.split('/').pop()
      const imageVal = getMapVal(imageMap, imgKey, imgObj)
      imageMap.set(imgKey, imageVal)
    }
  }
  return imageMap
}

/**
 * Fetches image objects from array of image urls
 * @param {Array<String>} images
 * @returns {Array<Object>} - array of image objects
 */
const _getImageObjects = async (images) => {
  return Promise.all(images.map(image => _readImageFromUrl(image)))
}

/**
 * Creates map of hashes to images arrays. Images resulting in the same hash will
 * be replaced if they are larger than whats hashed under the same hash
 * @param {Map<String,Object>} images - map of images object where key is image name and value is image object
 * @returns {Map<String,Object>} - map of image urls to hashes e.g. { hash: { url, height, width}} }
 */
const _dedupeByImageRender = async (images) => {
  const refMap = new Map();
  const imageIterator = images.values()
  let currentImage = imageIterator.next()
  while (currentImage.value) {
    const image = currentImage.value
    const imgHash = await hash(image)
    const imageVal = getMapVal(refMap, imgHash, image)
    refMap.set(imgHash, imageVal)
    currentImage = imageIterator.next()
  }
  return refMap
}

/**
 * Looks to see if an image key is in map, if it is and
 * image stored in map is larger than the image passed in
 * then it returns the image strored, otherwise returns new image
 * @param {Map} imageMap
 * @param {String} imgKey
 * @param {Object} newImage - image object with width property
 * @returns {Object} - looks if there is a
 */
 const getMapVal = (imageMap, imgKey, newImage) => {
  let value = newImage
  if (imageMap.has(imgKey)) {
    const currentImg = imageMap.get(imgKey)
    if (currentImg.width > newImage.width) {
      value = currentImg
    }
  }
  return value
}

/**
 * Fetches image from url and returns image buffer
 * @param {String} url
 * @returns {Object} - image object from @canvas/image imageFromBuffer fnc
 */
const _readImageFromUrl = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer"
    })
    const img = await imageFromBuffer(response.data)
    img.url = url
    return img
  } catch (error) {
    return null
  }
}

/**
 * Compares two images and returns similarity percentage
 * @param {String} imgUrl1
 * @param {String} imgUrl2
 * @returns {Number} - similarity percentage
 */
const compareImages = async (imgUrl1, imgUrl2) => {
  const img1 = await _readImageFromUrl(imgUrl1)
  const img2 = await _readImageFromUrl(imgUrl2)
  const hash1 = await hash(img1)
  const hash2 = await hash(img2)
  return _calculateSimilarity(hash1, hash2)
}

/**
 * Calculates similarity percentage between two hashes
 * @param {String} hash1
 * @param {String} hash2
 * @returns {Number} - similarity percentage
 */
const _calculateSimilarity = (hash1, hash2) => {
  let similarity = 0
  hash1Array = hash1.split("");
  hash1Array.forEach((bit, index) => {
    hash2[index] === bit ? similarity++ : null
  })
  return parseInt((similarity / hash1.length) * 100)
}

module.exports = {
  getUniqueImageUrls,
  compareImages
}