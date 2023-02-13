const Bee = require('bee-queue')
const { publish } = require('./pubsub')()
const concurrency = parseInt(process.env.MAX_CONCURRENT_JOBS || 1)


module.exports = function () {
  const queue = new Bee('scraper', {
    redis: { url: process.env.REDIS_URL }
  })
  queue.process(concurrency, async (job) => {
    console.time(`SCRAPE_JOB: ${job.id}`)
    const { data } = job
    const Scraper = require('./scraper')
    try {
      const scraper = new Scraper(data)
      await scraper.run()
      const results = scraper.results()
      if (process.env.ENABLE_LOGGING) console.log(JSON.stringify(results))
      await publish(results)
      console.timeEnd(`SCRAPE_JOB: ${job.id}`)
      console.log(results)
      // return results
    } catch (error) {
      console.timeEnd(`SCRAPE_JOB: ${job.id}`)
      console.error(error)
      // return error
    }
  })

  queue.checkStalledJobs(60000, (err, numStalled) => {
    // prints the number of stalled jobs detected every 60000 ms
    console.log('Checked stalled jobs', numStalled)
  })

  return queue
}
