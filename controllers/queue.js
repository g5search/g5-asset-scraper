const enableLogging = process.env.ENABLE_LOGGING === 'true'
const Bee = require('bee-queue')
const redis = require('redis')
const { publish } = require('./pubsub')
const concurrency = parseInt(process.env.MAX_CONCURRENT_JOBS || 1)

const redisOptions = {
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
  }
}

const client = redis.createClient(redisOptions)

const queue = new Bee('scraper', {
  redis: client,
  activateDelayedJobs: true,
  getEvents: true,
  sendEvents: true
});

queue.process(concurrency, async (job) => {
  console.time(`SCRAPE_JOB: ${job.id}`)
  const { data } = job
  const Scraper = require('./scraper')
  try {
    const scraper = new Scraper(data)
    await scraper.run()
    const results = scraper.results()
    if (enableLogging) console.info(JSON.stringify(results))
    console.timeEnd(`SCRAPE_JOB: ${job.id}`)
    return results;
  } catch (error) {
    console.timeEnd(`SCRAPE_JOB: ${job.id}`)
    return error;
  }
})

queue.on('ready', () => {
  console.log('******* Queue is Ready!')
})

const messageHandler = (message) => {
  if (enableLogging) console.log(`******* Received message ${message.id}:`)
  try {
    let data
    data = Buffer.from(message.data, 'base64').toString().trim()
    data = JSON.parse(data)
    enqueue(data)
  } catch (error) {
    console.error(`******* Error: ${error}`)
  }
  message.ack()
}

const enqueue = async (data) => {
  if (!queue || !data) throw new Error({ message: 'No queue or data provided.' })
  const job = await queue
                .createJob(data)
                .backoff('fixed', 1000)
                .timeout(600000)                    
                .retries(1)  
                .save()
  console.info(`******* Enqueued job ${job.id}`);
  job.on('succeeded', result => publish(result));
  return job
}

module.exports = { queue, enqueue, messageHandler }
