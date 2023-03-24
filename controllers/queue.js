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

client.on('end', () => {
  console.debug('REDIS connection has been closed')
})
client.on('error', (err) => {
  console.error('REDIS client %o', err)
})
client.on('connect', () => {
  console.debug('REDIS connection is up and running')
})

const queue = new Bee('scraper', { redis: client })

queue.process(concurrency, async (job, done) => {
  console.time(`SCRAPE_JOB: ${job.id}`)
  const { data } = job
  const Scraper = require('./scraper')
  try {
    const scraper = new Scraper(data)
    await scraper.run()
    const results = scraper.results()
    if (enableLogging) console.log(JSON.stringify(results))
    return publish(results)
  } catch (error) {
    console.error(error)
    done(error)
  }
  console.timeEnd(`SCRAPE_JOB: ${job.id}`)
})

queue.checkStalledJobs(120000, async (err, numStalled) => {
  if (err) throw Error(err)
  if (enableLogging) console.log('Checked stalled jobs', numStalled)
  const health = await queue.checkHealth()
  if (enableLogging) console.log('Queue health', health)
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
  // queue is defined in another function. want to untangle that
  const job = queue.createJob(data)
  return job.timeout(600000).retries(1).save()
}

module.exports = { queue, enqueue, messageHandler }
