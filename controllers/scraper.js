const axios = require('axios')
const cheerio = require('cheerio')
const scrapers = require('../scrapers')

/**
 * Scrapes websites for assets (address, imeages, amentiies, emails)
 * @class Scraper
 */
class Scraper {
  constructor(params) {
    this.validate(params)
    this.beforeScrape = []
    this.afterScrape = []
    this.beforePageChange = []
    this.afterPageChange = []
    this.pages = params.pages
    this.url = null
    this.page = null
    this.$ = null
    this.rootProtocol = params.rootProtocol
    this.rootdomain = params.rootdomain
    this.pageSlug = null
    this.scrapers = params.scrapers
    this.returKeys = []
    this.template = params.template
    this.complete = false
    this.amenitiesConfig = params.amenitiesConfig
    this.config = params.config
    this.amenitiesTags = 'p, li, span, option, form, button, input, header, .btn'
    this.errors = {}
  }

  includeScrapers () {
    Object.keys(this.scrapers)
      .forEach((key) => {
        if (this.scrapers[key]) scrapers[key](this)
      })
  }

  addScraper (hookName, func) {
    if (this[hookName] === undefined || typeof hookName !== 'string' || typeof func !== 'function') {
      throw new Error('bad params: addScraper function')
    }
    this[hookName].push(func)
  }

  // propName always string, value doesnt need to be typechecked, boolean
  addProp(propName, value, returnProp = false) {
    if (typeof propName !== 'string' || typeof returnProp !== 'boolean') {
      throw new Error('bad params: addProp function')
    }
    this[propName] = value
    if (returnProp) this.returKeys.push(propName)
  }

  async runBeforeScrape() {
    for (let i = 0 ; i < this.beforeScrape.length; i++) {
      try {
        await this.beforeScrape[i](this)
      } catch (error) {
        console.error(error)
      }
    }
  }

  async runAfterScrape () {
    for (let i = 0 ; i < this.afterScrape.length; i++) {
      try {
        await this.afterScrape[i](this)
      } catch (error) {
        console.error(error)
      }
    }
  }

 async runBeforePageChange () {
    for (let i = 0 ; i < this.beforePageChange.length; i++) {
      try {
        await this.beforePageChange[i](this)
      } catch (err) {
        console.error(err)
      }
    }
  }

  async runAfterPageChange () {
    for (let i = 0 ; i < this.afterPageChange.length; i++) {
      try {
        await this.afterPageChange[i](this) 
      } catch (error) {
        console.log(error)
      }
    }
  }

  getPageSlug () {
    const splitUrl = this.url.split('/').filter(val => val)
    return splitUrl[splitUrl.length -1]
  }

  async run () {
    this.includeScrapers()
    await this.runBeforeScrape()
    for (let i = 0; i < this.pages.length; i++) {
      await this.runBeforePageChange()
      try {
        this.url = this.pages[i]
        this.pageSlug = this.getPageSlug()
        await this.getPage()
        this.parsePage()
        await this.runAfterPageChange()
      } catch (error) {
        this.errors[this.url] = error
      }
    }
    await this.runAfterScrape()
    this.complete = true
  }

  async getPage () {
    const req = await axios.get(this.url)
    this.page = req.data
  }

  async parsePage () {
    this.$ = cheerio.load(this.page)
  }

  results () {
    const result = {
      errors: this.errors
    }
    this.returKeys.forEach(key => result[key] = this[key])
    return result
  }

  validate (params) {
    if (!params.rootProtocol || (params.rootProtocol !== 'https' && params.rootProtocol !== 'http')) throw new Error('rootProtocol must be set and be either http or https')
    if (!params.pages || !Array.isArray(params.pages) || params.pages.length === 0) throw new Error('pages must be a non-empty array')
    if (!params.scrapers || typeof params.scrapers !== 'object') throw new Error ('scrapers must be an object')
    if (!params.rootdomain || (typeof params.rootdomain !== 'string') || params.rootdomain === "") throw new Error('rootdomain must be set and a string') 
    if (!params.amenitiesConfig || typeof params.amenitiesConfig !== 'object') throw new Error ('missing amenities config')
  }
}

module.exports = Scraper
