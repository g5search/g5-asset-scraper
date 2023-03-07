const enableLogging = process.env.ENABLE_LOGGING === 'true'
const Bee = require('bee-queue')
const redis = require('redis')
const { publish } = require('./pubsub')()
const concurrency = parseInt(process.env.MAX_CONCURRENT_JOBS || 1)
const redisOptions = {
  url: process.env.REDIS_URL,
  retry_strategy: function (options) {
    return Math.min(options.attempt * 100, 3000)
  }
}

module.exports = function () {
  const client = redis.createClient(redisOptions)
  client.on('end', () => {
    console.debug('REDIS connection has been closed')
  })
  client.on('error', (err) => {
    console.error('REDIS client %o', err)
  })
  client.on('connect', () => {
    console.debug('REDIS connection is up and running')
  })
  const queue = new Bee('scraper', {
    redis: client,
    removeOnSuccess: true
  })
  queue.process(concurrency, async (job) => {
    console.time(`SCRAPE_JOB: ${job.id}`)
    const { data } = job
    const Scraper = require('./scraper')
    try {
      const scraper = new Scraper(data)
      await scraper.run()
      const results = scraper.results()
      if (enableLogging) console.log(JSON.stringify(results))
      await publish(results)
      console.timeEnd(`SCRAPE_JOB: ${job.id}`)
    } catch (error) {
      console.timeEnd(`SCRAPE_JOB: ${job.id}`)
      console.error(error)
    }
  })
  

  // queue.checkStalledJobs(60000, (err, numStalled) => {
  //   // prints the number of stalled jobs detected every 60000 ms
  //   if (enableLogging) console.log('Checked stalled jobs', numStalled)
  // })

  return queue
}
