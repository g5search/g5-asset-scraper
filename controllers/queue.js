const enableLogging = process.env.ENABLE_LOGGING === 'true';
const {Queue, Worker} = require('bullmq');
const { publish } = require('./pubsub')
const concurrency = parseInt(process.env.MAX_CONCURRENT_JOBS || 1)
const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379'
};

const queue = new Queue('scraper', { connection });

const workerHandler = async (job) => {
  console.log({ job });
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
};

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
  const job = await queue.add('scrape', data);
  console.info(`******* Enqueued job ${job.id}`);
  // job.on('succeeded', result => publish(result));
  return job
}

const worker = new Worker('scraper', workerHandler, { connection, concurrency });

module.exports = { queue, enqueue, messageHandler }
