const enableLogging = process.env.ENABLE_LOGGING === 'true'
const faktory = require('faktory-worker')
const { publish } = require('./pubsub')
const concurrency = parseInt(process.env.MAX_CONCURRENT_JOBS || 1)
const PUBSUB_TOPIC = process.env.PUBSUB_TOPIC

const faktoryOptions = {
  timeout: 120,
  url: process.env.FAKTORY_URL || 'tcp://localhost:7419',
  concurrency
}

// logs job processing time
faktory.use(async (ctx, next) => {
  const start = process.hrtime();
  await next();
  const time = process.hrtime(start);
  console.info("%s took %ds %dms", ctx.job.jobtype, time[0], time[1] / 1e6);
})

const scrapeHandler = async (data) => {
  const Scraper = require('./scraper');
  try {
    const scraper = new Scraper(data);
    await scraper.run();
    const results = scraper.results();
    if (enableLogging) console.info(JSON.stringify(results));
    await publish(PUBSUB_TOPIC, results);
    return results;
  } catch (error) {
    return error;
  }
}

faktory.register('scrape', scrapeHandler)

const enqueue = async (data) => {
  if (!faktory || !data) throw new Error({ message: 'No queue or data provided.' })
  const client = await faktory.connect()
  await client.job('scrape', data).push()
  await client.close()

  // return client;
}

const messageHandler = async (message) => {
  if (enableLogging) console.log(`******* Received message ${message.id}:`)
  try {
    let data
    data = Buffer.from(message.data, 'base64').toString().trim()
    data = JSON.parse(data)
    await enqueue(data)
    message.ack()
    console.info({ message});
  } catch (error) {
    console.error(`******* Error: ${error}`)
  }
  message.ack();
  console.info({ message});
}

faktory
  .work(faktoryOptions)
  // .then(res => publish(res))
  .catch(error => console.error(error))

module.exports = { faktory, enqueue, messageHandler }