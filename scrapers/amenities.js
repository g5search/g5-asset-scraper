module.exports = {
  init,
  getAmenities,
  setAmenitiesFromConfig,
  getAmenitiesFromTemplate,
  amenityAlreadyFound,
  getCopy,
  buildRegexPattern,
  keywordMatch
}

function init (Scraper) {
  Scraper.addProp('amenities', {}, true)
  Scraper.addScraper('afterPageChange', getAmenities)
}


/**
 * Sets scraper.amenities property in the instance of the scraper class passed in
 * @param {Object} scraper - instance of scraper class
 */
function getAmenities(scraper) {
  if (scraper.template && scraper.template.amenities.slug === scraper.pageSlug) {
     scraper.amenities = getAmenitiesFromTemplate(scraper)
  } else {
    setAmenitiesFromConfig(scraper)
  }
}


/**
 * Loops over scraper amenitites config and adds data found to amenities
 * class property
 * ex: { amenties: { apartment_amenities: { airConditioning: {text: 'Air Conditioning, value: 'airConditioning'}}}}
 * @param {Object} scraper - instance of scraper class
 */
function setAmenitiesFromConfig (scraper) {
  const copy = getCopy(scraper.$, scraper.amenitiesTags)
  const categoryKeys = Object.keys(scraper.amenitiesConfig)
  categoryKeys.forEach((categoryKey) => {
    const category = scraper.amenitiesConfig[categoryKey]
    if (!scraper.amenities[categoryKey]) scraper.amenities[categoryKey] = {}
    category.forEach((amenityObj, i) => {
      const { text, value, variants } = amenityObj
      const alreadyFound = amenityAlreadyFound(value, scraper.amenities[categoryKey])
      if (!alreadyFound) {
        const variantsIsArray = Array.isArray(variants)
        const amenities = variantsIsArray ? [text, ...variants] : [text]
        const hasAmenity = keywordMatch(amenities, copy)
        // adds amenity to scraper.amenities.category
        if (hasAmenity) {
          scraper.amenities[categoryKey][value] = { text, value }
        }
      }
    })
  })
}


/**
 * Uses template provided to match amenities on page
 * @param {Object} scraper - instance of Scraper class
 * @returns {Object}
 */
function getAmenitiesFromTemplate (scraper) {
  return scraper.$(scraper.template.amenities.selector).map((i, el) => {
    return scraper.$(el).text().replace(/\s\s+/gm, ' ').trim()
   }).get().filter(a => a)
}


/**
 * Returns true if a truthy value exists at obj[key]
 * @param {String} key
 * @param {Object} obj
 * @returns {Boolean} 
 */
function amenityAlreadyFound(key, obj) {
  return !!(obj[key])
}


/**
 * Finds all copy from a page using the following selectors
 * 'p, li, span, option, form, button, input, header, .btn'
 * @param {Function} $ - instance of cheerio selector
 * @param {String} tags - comma seperated list of selector tags
 * @returns {String} - copy from page matching selectors
 */
function getCopy($, tags) {
  return $('*')
    .each(function () {
      $(this).append(' ')
    })
    .find(tags)
    .text()
    .replace(/\s\s+/g, ' ')
}


/**
 * Builds a regex pattern that matches all
 * keywords from array of strings passed in
 * @param {Array} keywords - array of strings
 * @returns {Object} -Regex object
 */
function buildRegexPattern(keywords) {
  if (!Array.isArray(keywords)) throw new Error('keywords must be an array')
  const string = keywords.map(word => {
    const isPlural = word.length > 2 && word.slice(-1) === 's'
    const pluralizedWord = isPlural ? word : `${word}s`
    return `(?:^|\\b)${pluralizedWord}?(?:$|\\b)`
  })
  .join('|')
  return new RegExp(string, 'gi')
}

/**
 * Returns true if any of the keywords passed in the first parameter
 * have a substring match in the second parameter
 * @param {Array} keywords
 * @param {String} copy - string of words
 * @returns {Boolean} true if there is a match false if not
 */
function keywordMatch(keywords, copy) {
  const pattern = buildRegexPattern(keywords)
  return pattern.test(copy)
}