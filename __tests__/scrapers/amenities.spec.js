const scrapers = require('../../scrapers')
const amenitiesConfig = require('../config/amenitites-config')

describe('amenities Scraper' , () => {

  let Scraper
  beforeEach(() => {
    Scraper = {
      amenitiesConfig,
      amenities: {},
      $: cheerio.load(`<div class="html-content">
      <h2>Apartment Features:</h2>
  <ul>
    <li>New/Renovated Interior</li>
    <li>Spacious Floor Plans</li>
    <li>Granite or Quartz Counter Tops</li>
    <li>Black Appliances</li>
    <li>French-Door Refrigerator*</li>
    <li>Wood-Style Flooring</li>
    <li>Pre-Wired for Surround Sound</li>
    <li>Oversized Closets</li>
    <li>Washer &amp; Dryer in Unit</li>
    <li>9ft Ceilings</li>
    <li>Large Patio/Balconies</li>
    <li>Valet Door-to-Door Trash Service</li>
    <li>Cable/Satellite Available</li>
    <li>Garbage Disposal</li>
    <li>Electric Stove</li>
    <li>Recessed Sink</li>
    <li>Dishwasher</li>
    <li>Ceiling Fans*</li>
    <li>Central Air</li>
    <li>Linen Closets</li>
    <li>Attached &amp; Detached Garages</li>
  </ul>
  <p>*Select Homes</p>
  </div>`),
      addScraper: jest.fn(),
      addProp: jest.fn(),
      pageSlug: 'amenities',
      template: {
        amenities: {
          slug: 'amenities',
          selector: 'ul li'
        }
      }
      }
  })
  const cheerio = require('cheerio')
  const {
    init,
    getAmenities,
    setAmenitiesFromConfig,
    getAmenitiesFromTemplate,
    amenityAlreadyFound,
    getCopy,
    buildRegexPattern,
    keywordMatch
  } = require('../../scrapers/amenities')
  test('AddScraper Called with function', () => {
    init(Scraper)
    expect(Scraper.addScraper).toHaveBeenCalledWith('afterPageChange', getAmenities)
  })

  test('Scrape Amenities With Template', () => {
    getAmenities(Scraper)
    expect(Scraper.amenities).toEqual([
      'New/Renovated Interior',
      'Spacious Floor Plans',
      'Granite or Quartz Counter Tops',
      'Black Appliances',
      'French-Door Refrigerator*',
      'Wood-Style Flooring',
      'Pre-Wired for Surround Sound',
      'Oversized Closets',
      'Washer & Dryer in Unit',
      '9ft Ceilings',
      'Large Patio/Balconies',
      'Valet Door-to-Door Trash Service',
      'Cable/Satellite Available',
      'Garbage Disposal',
      'Electric Stove',
      'Recessed Sink',
      'Dishwasher',
      'Ceiling Fans*',
      'Central Air',
      'Linen Closets',
      'Attached & Detached Garages'
    ])
  })

  test('Scrape Amenities Without Template', () => {
    Scraper.template = null
    getAmenities(Scraper)
    expect(Scraper.amenities).toHaveProperty('apartment_amenities')
    expect(Scraper.amenities).toHaveProperty('community_amenities')
    expect(typeof Scraper.amenities.apartment_amenities).toEqual('object')
    expect(typeof Scraper.amenities.community_amenities).toEqual('object')
  })

  // test amenityAlreadyFound function  
  test('Amenity Already Found', () => {
    Scraper.amenities = {
      apartment_amenities: {
        'New/Renovated Interior': {}
      },
      community_amenities: {
        'Spacious Floor Plans': {}
      }
    }
    const result = amenityAlreadyFound('New/Renovated Interior', Scraper.amenities.apartment_amenities)
    expect(result).toEqual(true)
  } )
  test('Amenity Not Found', () => {
    Scraper.amenities = {
      apartment_amenities: {},
      community_amenities: {
        'Spacious Floor Plans': true
      }
    }
    const result = amenityAlreadyFound('New/Renovated Interior', Scraper.amenities.apartment_amenities)
    expect(result).toEqual(false)
  } )

  test ('Get copy', () => {
    const result = getCopy(Scraper.$, 'h2')
    expect(result).toEqual('Apartment Features: ')
  })
  test ('Get copy with no result', () => {
    const result = getCopy(Scraper.$, 'h1')
    expect(result).toEqual('')
  })

  test ('buildRegex pattern with array', () => {
    const result = buildRegexPattern(['hello', 'world'])
    expect(result instanceof RegExp).toEqual(true)
    expect(result).toEqual(/(?:^|\b)hellos?(?:$|\b)|(?:^|\b)worlds?(?:$|\b)/gi)
  })

  test ('buildRegex pattern with string', () => {
    expect(() => {
      buildRegexPattern('hello')
    }).toThrow('keywords must be an array')
  })
})
