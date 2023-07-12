const mockAxios = require('axios')
const cheerio = require('cheerio')
const { PubSub } = require('@google-cloud/pubsub')

const Scraper = require('../../controllers/scraper')
const html = require('../config/html')
const params = require('../config/params')
const amenitiesConfig = require('../config/amenitites-config')

describe('Scraper class', () => {

  let scraper, mockFunc1, mockFunc2
  beforeEach(() => {
    scraper = new Scraper(params)
    mockFunc1 = jest.fn()
    mockFunc2 = jest.fn()
  })

  test('bad constructor params', () => {
    expect(() => {
      new Scraper({ rootProtocol: null, amenitiesConfig })
    }).toThrow('rootProtocol must be set and be either http or https')
    expect(() => {
      new Scraper({ rootProtocol: 'https', pages: [], amenitiesConfig })
    }).toThrow('pages must be a non-empty array')
    expect(() => {
      new Scraper({ rootProtocol: 'https', pages: ['https://solaire8250.com/floor-plans/'], scrapers: null, amenitiesConfig })
    }).toThrow('scrapers must be an object')
    expect(() => {
      new Scraper({ rootProtocol: 'https', pages: ['https://solaire8250.com/floor-plans/'], scrapers: {}, rootdomain: '', amenitiesConfig })
    }).toThrow('rootdomain must be set and a string')
    expect(() => {
      new Scraper({ rootProtocol: 'https', pages: ['https://solaire8250.com/floor-plans/'], scrapers: {}, rootdomain: 1, amenitiesConfig })
    }).toThrow('rootdomain must be set and a string')
    expect(() => {
      new Scraper({ rootProtocol: 'https', pages: ['https://solaire8250.com/floor-plans/'], scrapers: {}, rootdomain: null, amenitiesConfig })
    }).toThrow('rootdomain must be set and a string')
  })

  test('constructor prop tests', () => {
    expect(scraper.beforeScrape).toEqual([])
    expect(scraper.afterScrape).toEqual([])
    expect(scraper.beforePageChange).toEqual([])
    expect(scraper.afterPageChange).toEqual([])
    expect(Array.isArray(scraper.pages)).toEqual(true)
    expect(scraper.pages.length > 0).toEqual(true)
    expect(scraper.url).toEqual(null)
    expect(scraper.page).toEqual(null)
    expect(scraper.$).toEqual(null)
    expect(scraper.rootProtocol).toEqual('https' || 'http')
    expect(typeof scraper.rootdomain).toEqual('string')
    expect(scraper.pageSlug).toEqual(null)
    expect(typeof scraper.scrapers).toEqual('object')
    expect(Object.keys(scraper.scrapers).length > 0).toEqual(true)
    expect(scraper.returKeys).toEqual([])
    expect(typeof scraper.template).toEqual('object')
    expect(scraper.errors).toEqual({})
  })

  test('includeScrapers', () => {
    scraper.includeScrapers() // set state bofore assertions
    // expect(scraper.addressRegex instanceof RegExp).toEqual(true)
    expect(scraper.emailRegex instanceof RegExp).toEqual(true)
    expect(scraper.phoneRegex instanceof RegExp).toEqual(false)
    expect(scraper.afterPageChange.length).toEqual(Object.keys(scraper.scrapers).length - 2)
    expect(scraper.afterPageChange.every(func => typeof func === 'function')).toEqual(true)
    expect(scraper.afterScrape.every(func => typeof func === 'function')).toEqual(true)
    expect(Array.isArray(scraper.returKeys)).toEqual(true)
  })

  test('addScraper', () => {  
    //test passing
    const func = (x) => x + x
    scraper.addScraper('beforeScrape', func) 
    expect(scraper.beforeScrape[0]).toEqual(func)
    expect(typeof scraper.beforeScrape[0]).toEqual('function')
    // test failing
    expect(() => { //not a real hook name
     scraper.addScraper('notAHookName', func)
    }).toThrow('bad params: addScraper function')
    expect(() => { //bad 1st param val
      scraper.addScraper(1, func)
    }).toThrow('bad params: addScraper function')
    expect(() => { //bad 2nd param val
      scraper.addScraper('beforeScrape', {})
    }).toThrow('bad params: addScraper function')
  })

  test('addProp', () => {  
    //test passing
    scraper.addProp('testProp', 123, true) 
    expect(scraper.testProp).toEqual(123)
    expect(scraper.returKeys.includes('testProp')).toEqual(true)

    scraper.addProp('testProp2', 123, false) 
    expect(scraper.returKeys.includes('testProp2')).toEqual(false)
    // test failing
    expect(() => { //bad 1st param val
      scraper.addProp(1, 123, false)
    }).toThrow('bad params: addProp function')
    expect(() => { //bad 3rd param val
      scraper.addProp('helloWorld', 123, {})
    }).toThrow('bad params: addProp function')
  })

  test('runBeforeScrape', async () => {
    await scraper.runBeforeScrape()
    expect(mockFunc1).toHaveBeenCalledTimes(0)
    expect(mockFunc2).toHaveBeenCalledTimes(0)
    scraper.beforeScrape.push(mockFunc1, mockFunc2)
    await scraper.runBeforeScrape()
    expect(mockFunc1).toHaveBeenCalledTimes(1)
    expect(mockFunc1).toHaveBeenCalledWith(scraper)
    expect(mockFunc2).toHaveBeenCalledTimes(1)
    expect(mockFunc2).toHaveBeenCalledWith(scraper)
  })

  test('runAfterScrape', async () => {
    await scraper.runAfterScrape()
    expect(mockFunc1).toHaveBeenCalledTimes(0)
    expect(mockFunc2).toHaveBeenCalledTimes(0)
    scraper.afterScrape.push(mockFunc1, mockFunc2)
    await scraper.runAfterScrape()
    expect(mockFunc1).toHaveBeenCalledTimes(1)
    expect(mockFunc1).toHaveBeenCalledWith(scraper)
    expect(mockFunc2).toHaveBeenCalledTimes(1)
    expect(mockFunc2).toHaveBeenCalledWith(scraper)
  })

  test('runBeforePageChange', async () => {
    await scraper.runBeforePageChange()
    expect(mockFunc1).toHaveBeenCalledTimes(0)
    expect(mockFunc2).toHaveBeenCalledTimes(0)
    scraper.beforePageChange.push(mockFunc1, mockFunc2)
    await scraper.runBeforePageChange()
    expect(mockFunc1).toHaveBeenCalledTimes(1)
    expect(mockFunc1).toHaveBeenCalledWith(scraper)
    expect(mockFunc2).toHaveBeenCalledTimes(1)
    expect(mockFunc2).toHaveBeenCalledWith(scraper)
  })

  test('runAfterPageChange', async () => {
    await scraper.runAfterPageChange()
    expect(mockFunc1).toHaveBeenCalledTimes(0)
    expect(mockFunc2).toHaveBeenCalledTimes(0)
    scraper.afterPageChange.push(mockFunc1, mockFunc2)
    await scraper.runAfterPageChange()
    expect(mockFunc1).toHaveBeenCalledTimes(1)
    expect(mockFunc1).toHaveBeenCalledWith(scraper)
    expect(mockFunc2).toHaveBeenCalledTimes(1)
    expect(mockFunc2).toHaveBeenCalledWith(scraper)
  })

  test('send buffer', async () => {
    const mockProjectId = 12345
    const pubSubClient = new PubSub({ mockProjectId })
    scraper.pubSubClient = pubSubClient
    const spyTopic = jest.spyOn(pubSubClient, 'topic')
    const spyPublishMessage = jest.spyOn(pubSubClient, 'publishMessage')
    await scraper.sendBuffer(1, 'www.test.com', null, null)
    expect(spyTopic).toHaveBeenCalledTimes(1)
    expect(spyTopic).toHaveBeenCalledWith(scraper.topicName, { enableMessageOrdering: true })
    expect(spyPublishMessage).toHaveBeenCalledTimes(1)
  })

  test('run', async () => {
    const mockincludeScrapers = jest.spyOn(scraper, 'includeScrapers').mockImplementation(() => jest.fn())
    const mockrunBeforeScrape = jest.spyOn(scraper, 'runBeforeScrape').mockImplementation(() => jest.fn())
    const mockrunBeforePageChange = jest.spyOn(scraper, 'runBeforePageChange').mockImplementation(() => jest.fn())
    const mockgetPage = jest.spyOn(scraper, 'getPage').mockImplementation(() => jest.fn())
    const mockparsePage = jest.spyOn(scraper, 'parsePage').mockImplementation(() => jest.fn())
    const mockrunAfterPageChange = jest.spyOn(scraper, 'runAfterPageChange').mockImplementation(() => jest.fn())
    const mockrunAfterScrape = jest.spyOn(scraper, 'runAfterScrape').mockImplementation(() => jest.fn())
    await scraper.run()
    // test pass
    expect(mockincludeScrapers).toHaveBeenCalledTimes(1)
    expect(mockrunBeforeScrape).toHaveBeenCalledTimes(1)
    expect(mockrunBeforePageChange).toHaveBeenCalledTimes(scraper.pages.length)
    expect(mockgetPage).toHaveBeenCalledTimes(scraper.pages.length)
    expect(mockparsePage).toHaveBeenCalledTimes(scraper.pages.length)
    expect(mockrunAfterPageChange).toHaveBeenCalledTimes(scraper.pages.length)
    expect(mockrunAfterScrape).toHaveBeenCalledTimes(1)
  })

  test('run wihtout topicName', async () => {
    scraper.topicName = null
    const mockincludeScrapers = jest.spyOn(scraper, 'includeScrapers').mockImplementation(() => jest.fn())
    const mockrunBeforeScrape = jest.spyOn(scraper, 'runBeforeScrape').mockImplementation(() => jest.fn())
    const mockrunBeforePageChange = jest.spyOn(scraper, 'runBeforePageChange').mockImplementation(() => jest.fn())
    const mockgetPage = jest.spyOn(scraper, 'getPage').mockImplementation(() => jest.fn())
    const mockparsePage = jest.spyOn(scraper, 'parsePage').mockImplementation(() => jest.fn())
    const mockrunAfterPageChange = jest.spyOn(scraper, 'runAfterPageChange').mockImplementation(() => jest.fn())
    const mockrunAfterScrape = jest.spyOn(scraper, 'runAfterScrape').mockImplementation(() => jest.fn())
    await scraper.run()
    // test pass
    expect(mockincludeScrapers).toHaveBeenCalledTimes(1)
    expect(mockrunBeforeScrape).toHaveBeenCalledTimes(1)
    expect(mockrunBeforePageChange).toHaveBeenCalledTimes(scraper.pages.length)
    expect(mockgetPage).toHaveBeenCalledTimes(scraper.pages.length)
    expect(mockparsePage).toHaveBeenCalledTimes(scraper.pages.length)
    expect(mockrunAfterPageChange).toHaveBeenCalledTimes(scraper.pages.length)
    expect(mockrunAfterScrape).toHaveBeenCalledTimes(1)
  })

  test('run with error', async () => {
    const mockincludeScrapers = jest.spyOn(scraper, 'includeScrapers').mockImplementation(() => jest.fn())
    const mockrunBeforeScrape = jest.spyOn(scraper, 'runBeforeScrape').mockImplementation(() => jest.fn())
    const mockrunBeforePageChange = jest.spyOn(scraper, 'runBeforePageChange').mockImplementation(() => jest.fn())
    const mockgetPage = jest.spyOn(scraper, 'getPage').mockRejectedValueOnce(new Error('test error'))
    await scraper.run()
    expect(scraper.errors['https://solaire8250.com/floor-plans/'].message).toEqual('test error')
  })

  test('run error without topic name', async () => {
    scraper.topicName = null
    const mockincludeScrapers = jest.spyOn(scraper, 'includeScrapers').mockImplementation(() => jest.fn())
    const mockrunBeforeScrape = jest.spyOn(scraper, 'runBeforeScrape').mockImplementation(() => jest.fn())
    const mockrunBeforePageChange = jest.spyOn(scraper, 'runBeforePageChange').mockImplementation(() => jest.fn())
    const mockgetPage = jest.spyOn(scraper, 'getPage').mockRejectedValueOnce(new Error('test error'))
    await scraper.run()
    expect(scraper.errors['https://solaire8250.com/floor-plans/'].message).toEqual('test error')
  })

  test('getPage', async () => {
    scraper.url = 'https://www.getg5.com'
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: html
      })
    )
    await scraper.getPage()
    expect(scraper.page).toEqual(html)
    expect(mockAxios.get).toHaveBeenCalled()
    expect(mockAxios.get).toHaveBeenCalledWith('https://www.getg5.com')
  })

  test('parsePage', async () => {
    scraper.page = html
    const spy = jest.spyOn(cheerio, 'load')
    await scraper.parsePage()
    expect(spy).toHaveBeenCalled()
    expect(typeof scraper.$).toEqual('function')
    expect(spy).toHaveBeenCalledWith(html)
    spy.mockRestore()
  })

  test('results', () => {
    scraper.errors['getg5.com'] = 'bad page'
    scraper.address = {}
    scraper.amenities = {}
    scraper.returKeys.push('address', 'amenities')
    const results = scraper.results()
    expect(results).toHaveProperty('errors')
    expect(results).toHaveProperty('address')
    expect(results).toHaveProperty('amenities')
    expect(results.errors).toEqual({'getg5.com': 'bad page'})
    expect(results.errors['getg5.com']).toEqual('bad page')

  })

  test('validate', () => {
    expect(() => {
      scraper.validate({ rootProtocol: null })
    }).toThrow('rootProtocol must be set and be either http or https')
    expect(() => {
      scraper.validate({ rootProtocol: 'nothttpsorhttps' })
    }).toThrow('rootProtocol must be set and be either http or https')
    expect(() => {
      scraper.validate({ rootProtocol: 'https', pages: [] })
    }).toThrow('pages must be a non-empty array')
    expect(() => {
      scraper.validate({ rootProtocol: 'https', pages: ['https://solaire8250.com/floor-plans/'], scrapers: null })
    }).toThrow('scrapers must be an object')
    expect(() => {
      scraper.validate({ rootProtocol: 'https', pages: ['https://solaire8250.com/floor-plans/'], scrapers: {}, rootdomain: '' })
    }).toThrow('rootdomain must be set and a string')
    expect(() => {
      scraper.validate({ rootProtocol: 'https', pages: ['https://solaire8250.com/floor-plans/'], scrapers: {}, rootdomain: 1 })
    }).toThrow('rootdomain must be set and a string')
    expect(() => {
      scraper.validate({ rootProtocol: 'https', pages: ['https://solaire8250.com/floor-plans/'], scrapers: {}, rootdomain: null })
    }).toThrow('rootdomain must be set and a string')
  })
})
