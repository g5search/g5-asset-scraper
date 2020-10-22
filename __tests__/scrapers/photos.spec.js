const scrapers = require('../../scrapers')
// const mockCloudinary = require('../../cloudinary')
 
describe('Photos Scraper' , () => {
  const cheerio = require('cheerio')
  const { init, uploadPhotos, scrapePhotos, formatImageUrl } = require('../../scrapers/photos')
  beforeEach(() => {
    Scraper = {
      addScraper: jest.fn(),
      addProp: jest.fn(),
      pageSlug: 'amenities',
      template: {},
      imageUrls: {},
      url: 'testing.com'
      }
  })

  test('AddScraper Called with function', () => {
    init(Scraper)
    expect(Scraper.addScraper).toHaveBeenCalledWith('afterPageChange', scrapePhotos)
  })

  test('Scrape Photos', () => {
    Scraper.page = '<p><img src="https://test.com/testing.jpg"></p>'
    scrapePhotos(Scraper)
    expect(Scraper.imageUrls).toEqual({ 'https://test.com/testing.jpg': [ 'testing.com' ] })
  })
  test('Format Urls', () => {
    const url = formatImageUrl('https://test.com/testing.jpg', "https", 'test.com')
    const url2 = formatImageUrl('background-image: url(https://test.com/testing.jpg)', "https", 'test.com')
    const url3 = formatImageUrl('//test.com/testing.jpg', "https", 'test.com')
    const url4 = formatImageUrl('/testing.jpg', "https", 'test.com')
    expect(url).toEqual('https://test.com/testing.jpg')
    expect(url2).toEqual('https://test.com/testing.jpg')
    expect(url3).toEqual('https://test.com/testing.jpg')
    expect(url4).toEqual('https://test.com/testing.jpg')
  })

  // test('Upload Photo', async () => {
  //   Scraper.imageUrls = { 'https://test.com/testing.jpg': [ 'testing.com' ] }
  //   await uploadPhotos(Scraper)
  //   mockCloudinary.mockImplementationOnce(() => jest.fn())
  //   expect(mockCloudinary).toHaveBeenCalled()
  //   // .mockImplementation(() => jest.fn())
  //   // expect(spy).toHaveBeenCalledWith(['https://test.com/testing.jpg'], { folder: 'testing', tags: ['testing.com']})
  // })
})