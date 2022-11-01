const Arena = require('bull-arena')
const Bee = require('bee-queue')

/**
 * Initialize the Arena server middleware
 * @param {Object} app an express app
 */
module.exports = function (app) {
  const arena = Arena({
    Bee,
    queues: [{
      name: 'Scrape_Requests',
      hostId: 'Asset Scraper',
      type: 'bee',
      prefix: 'bq'
    }]
  }, {
    basePath: '/arena',
    disableListen: true,
    url: process.env.REDIS_URL
  })
  app.use('/arena', arena)
}
