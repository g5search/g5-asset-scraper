const blockhash = require('blockhash-core')
const { getImageData } = require('@canvas/image')

/**
 * Hashes image url into binary string
 * @param {String} imageUrl
 * @returns {String} - binary string of image hash
 */
 const hash = async (imageObj) => {
  try {
    const hash = await blockhash.bmvbhash(getImageData(imageObj), 8)
    return _hexToBin(hash)
  } catch (error) {
    console.log(error)
  }
}

/**
 * Builds a binary string from a hex string
 * @param {String} hexString
 * @returns {String} Binary String
 */
const _hexToBin = (hexString) => {
  let result = "";
  for (i = 0; i < hexString.length; i++) {
    result += hexBinLookup[hexString[i]]
  }
  return result
}

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
}

module.exports = {
  hash
}