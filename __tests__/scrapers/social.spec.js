const cheerio = require('cheerio')
const Scraper = require('../../controllers/scraper')
const html = require('../config/html')
const params = require('../config/params.json')
const { init, getSocialLinks, socialMap, compareLinks } = require('../../scrapers/social')

describe('Social Scraper' , () => {
  let scraper
  const htmlWithSocialLinks = `<div class="social-links">
      <a href="https://www.facebook.com/M2-Apartment-Homes" class="facebook" title="Facebook" rel="me" target="_blank" aria-label="Visit Facebook page"><svg class="icon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://www.m2apartments.com/#footer-icon-facebook"></use></svg></a><a href="https://twitter.com/M2apts" class="twitter" title="Twitter" rel="me" target="_blank" aria-label="Visit Twitter page"><svg class="icon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://www.m2apartments.com/#footer-icon-twitter"></use></svg></a><a href="https://www.yelp.com/biz/m2-denver" class="yelp" title="Yelp" rel="me" target="_blank" aria-label="Visit Yelp page"><svg class="icon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://www.m2apartments.com/#footer-icon-yelp"></use></svg></a><a href="https://www.google.com/maps?cid=13190717218527977044" class="google-my-business" title="Google My Business" rel="me" target="_blank" aria-label="Google this business"><svg class="icon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://www.m2apartments.com/#footer-icon-gmb"></use></svg></a><a href="https://www.pinterest.com/m2apartments" class="pinterest" title="Pinterest" rel="me" target="_blank" aria-label="Visit Pinterest page"><svg class="icon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://www.m2apartments.com/#footer-icon-pinterest"></use></svg></a>
    </div>`
  beforeEach(() => {
    scraper = new Scraper(params)
  })
  test('init calls functions on Scraper', () => {
    const spyAddProp = jest.spyOn(scraper, 'addProp')
      .mockImplementation(() => jest.fn())
    const spyAddScraper = jest.spyOn(scraper, 'addScraper')
      .mockImplementation(() => jest.fn())
    const calls = [
      ["socialLinks", {}, true],
      ["socialMap", socialMap, false]
    ]
    init(scraper)
    expect(spyAddProp).toHaveBeenCalledTimes(2)
    expect(spyAddProp.mock.calls).toEqual(calls)
    expect(spyAddScraper).toHaveBeenCalledTimes(1)
    expect(spyAddScraper).toHaveBeenCalledWith('afterPageChange', getSocialLinks)
  })

  test('getSocialLinks with Selector and match', () => {
    jest.spyOn('../../scrapers/social', 'compareLinks')
    scraper.$ = cheerio.load(html)
    // init(scraper)
    // getSocialLinks(scraper)
    // expect(compareLinks).toHaveBeenCalledTimes(1)
    // expect(spyCompareLinks).toHaveBeenCalledWith('', scraper)
  })
  // test('getSocialLinks with Selector and no match', () => {})
  // test('getSocialLinks without Selector and match', () => {})
  // test('getSocialLinks without Selector and no match', () => {})
})
