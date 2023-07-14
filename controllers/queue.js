const enableLogging = process.env.ENABLE_LOGGING === 'true';
const {Queue, Worker} = require('bullmq');
const { publish } = require('./pubsub')
const concurrency = parseInt(process.env.MAX_CONCURRENT_JOBS || 1);
const timeout = parseInt(process.env.JOB_TIMEOUT || 600000);

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || 6379)
};
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  }
};

const limiter = {
  max: 10,
  duration: 1000,
};

const queue = new Queue('scraper', { limiter, defaultJobOptions, connection });

const onScrape = async (job) => {
  console.time(`SCRAPE_JOB: ${job.id}`)
  const { data } = job
  const Scraper = require('./scraper')
  try {
    const scraper = new Scraper(data)
    await scraper.run()
    const results = scraper.results()
    if (enableLogging) console.info(JSON.stringify(results))
    console.timeEnd(`SCRAPE_JOB: ${job.id}`)
    await publish(results);
    return results;
  } catch (error) {
    await publish(error);
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

const withTimeout = (ms, jobFunction) => {
  return function(...args) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Job timed out'));
      }, ms);
        
      Promise
        .resolve(jobFunction(...args))
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
};

const workerHandler = withTimeout(timeout, onScrape);
const worker = new Worker('scraper', workerHandler, { connection, concurrency });

const enqueue = async (data) => {
  if (!queue || !data) throw new Error({ message: 'No queue or data provided.' })
  const job = await queue.add('scrape', data);
  console.info(`******* Enqueued job ${job.id}`);
  // worker.on('completed', result => publish(result));
  worker.on('drained', () => console.info('******* Worker drained.'));
  worker.on('failed', (error) => console.error(`******* Worker failed: ${error}`));
  return job;
}


module.exports = { queue, enqueue, messageHandler, worker }
