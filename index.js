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
  await enqueue(req.body)
  res.status(204).send('Created')
})

const port = process.env.PORT || 8080
const TIMEOUT = 30 * 1000;

process.on('uncaughtException', async () => {
  try {
    await queue.close(TIMEOUT)
  } catch (err) {
    console.error('bee-queue failed to shut down gracefully', err)
  }
  // process.exit(1)
  console.info('Uncaught exception, gracefully closed queue.')
  await queue.settings.redis.connect()
  console.info(`Redis connection: ${queue.settings.redis.connected}`)
})

app.listen(port, async () => {
  const subscription = await subscribeWithFlowControl(queue)
  subscription.on('message', messageHandler)
  console.log({ redis: queue.settings.redis })
  console.log(`Listening on port :${port}`)
})
