require('dotenv').config()
const express = require('express')
const app = express()
app.use(express.json({ limit: '1000kb' }))
const Scraper = require('./controllers/scraper')
const { queue, enqueue, messageHandler } = require('./controllers/queue')
const { subscribeWithFlowControl } = require('./controllers/pubsub')

app.post('/', async (req, res) => {
  const { body } = req
  if (process.env.ENABLE_LOGGING) console.info(JSON.stringify(body))
  try {
    const scraper = new Scraper(body)
    await scraper.run()
    const results = scraper.results()
    if (process.env.ENABLE_LOGGING) console.info(JSON.stringify(results))
    res.json(results)
  } catch (error) {
    console.log(error)
    res.send(error.message)
  }
})

app.post('/enqueue', async (req, res) => {
  if (process.env.ENABLE_LOGGING) console.info(JSON.stringify(req.body))
  const job = await enqueue(req.body)
  console.info(`Job ${job.id} enqueued.`);
  res.status(204);
})

const port = process.env.PORT || 8080
const TIMEOUT = 30 * 1000;

process.on('uncaughtException', async () => {
  try {
    await queue.close(TIMEOUT)
  } catch (err) {
    console.error('bee-queue failed to shut down gracefully', err)
  }
  // queue and redis client don't have a method for attempting reconnection.
  // Do not really understand why it's disconnecting after an hour or so.
  queue.checkStalledJobs()
  // process.exit(1)
})

app.listen(port, async () => {
  const subscription = await subscribeWithFlowControl(queue)
  subscription.on('message', messageHandler)
  console.log(`Listening on port :${port}`)
})
