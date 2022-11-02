const Bee = require('bee-queue')

/**
 * Creates a new queue
 * @param {Object} app an express instance
 * @returns 
 */
module.exports = function (app) {
  const queue = new Bee('scraper', {
    isWorker: true,
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    }
  })
  queue.process(async (job, done) => {
    const { data } = job
    const Scraper = require('../scraper')
    try {
      const scraper = new Scraper(data)
      await scraper.run()
      const results = scraper.results()
      // if (process.env.ENABLE_LOGGING) console.log(JSON.stringify(results))
      // pubsub publish message with results
      done(null, results)
    } catch (error) {
      done(error)
    }
  })

  return queue
}
