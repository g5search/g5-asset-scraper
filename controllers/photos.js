const axios = require('axios')
const blockhash = require("blockhash-core")
const { imageFromBuffer, getImageData } = require("@canvas/image")

module.exports = {
  getUniqueImageUrls,
  compareImages
}
/**
 * Deduplucates images and returns array of objects
 * containing image url and size
 * @param {Array} images - array of image urls
 * @returns {Array} - returns an array of objects 
 */
async function getUniqueImageUrls(images) {
  const refMap = await _generateRefMap(images)
  const uniqueImages = []
  for (let [key, value] of refMap) {
    uniqueImages.push(value.url)
  }
  return uniqueImages
}

/**
 * Compares two images and returns similarity percentage
 * @param {String} imgUrl1
 * @param {String} imgUrl2
 * @returns {Number} - similarity percentage
 */
async function compareImages(imgUrl1, imgUrl2) {
  const img1 = await _readImageFromUrl(imgUrl1)
  const img2 = await _readImageFromUrl(imgUrl2)
  const hash1 = await _hash(img1)
  const hash2 = await _hash(img2)
  return _calculateSimilarity(hash1, hash2)
}

/**
 * Creates map of hashes to images arrays.
 * Images resulting in the same hash will be replcaed if they are larger than whats hashed
 * @param {Array} images - array of image urls
 * @returns {Map} - map of image urls to hashes e.g. { hash: { url, height, width}} }
 */
async function _generateRefMap(images) {
  const refMap = new Map();
  for (let i = 0; i < images.length; i++) {
    const imgObj = await _readImageFromUrl(images[i])
    const { height, width } = imgObj
    const imgHash = await _hash(imgObj)
    let value
    if (refMap.has(imgHash)) {
      const existingPath = refMap.get(imgHash)
      value = existingPath.height > height ? existingPath : { url: images[i], height, width }
    } else {
      value= { url: images[i], height, width }
    }
    refMap.set(imgHash, value)
  }
  return refMap
}


/**
 * Hashes image url into binary string
 * @param {String} imageUrl
 * @returns {String} - binary string of image hash
 */
async function _hash(imageObj) {
  try {
    const hash = await blockhash.bmvbhash(getImageData(imageObj), 8)
    return _hexToBin(hash)
  } catch (error) {
    console.log(error)
  }
}


/**
 * Fetches image from url and returns image buffer
 * @param {String} url
 * @returns {Buffer} - image buffer
 */
async function _readImageFromUrl(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer"
  })
  return imageFromBuffer(response.data)
}


/**
 * Builds a binary string from a hex string
 * @param {String} hexString
 * @returns {String} Binary String
 */
function _hexToBin(hexString) {
  const hexBinLookup = {
    0: "0000",
    1: "0001",
    2: "0010",
    3: "0011",
    4: "0100",
    5: "0101",
    6: "0110",
    7: "0111",
    8: "1000",
    9: "1001",
    a: "1010",
    b: "1011",
    c: "1100",
    d: "1101",
    e: "1110",
    f: "1111",
    A: "1010",
    B: "1011",
    C: "1100",
    D: "1101",
    E: "1110",
    F: "1111",
  };
  let result = "";
  for (i = 0; i < hexString.length; i++) {
    result += hexBinLookup[hexString[i]]
  }
  return result
}


/**
 * Calculates similarity percentage between two hashes
 * @param {String} hash1
 * @param {String} hash2
 * @returns {Number} - similarity percentage
 */
function _calculateSimilarity(hash1, hash2) {
  let similarity = 0;
  hash1Array = hash1.split("");
  hash1Array.forEach((bit, index) => {
    hash2[index] === bit ? similarity++ : null;
  });
  return parseInt((similarity / hash1.length) * 100);
}