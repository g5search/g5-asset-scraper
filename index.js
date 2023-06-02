require('dotenv').config()
const {
  ENABLE_LOGGING,
  PUBSUB_SUBSCRIPTION,
  PORT
} = process.env
const enableLogging = ENABLE_LOGGING === 'true'
const express = require('express')
const app = express()
app.use(express.json({ limit: '1000kb' }))
const Scraper = require('./controllers/scraper')
const { enqueue, messageHandler } = require('./controllers/queue')
const { subscribeWithFlowControl } = require('./controllers/pubsub')

app.post('/', async (req, res) => {
  const { body } = req
  if (enableLogging) console.info(JSON.stringify(body))
  try {
    const scraper = new Scraper(body)
    await scraper.run()
    const results = scraper.results()
    if (enableLogging) console.info(JSON.stringify(results))
    res.json(results)
  } catch (error) {
    console.log(error)
    res.send(error.message)
  }
})

app.post('/enqueue', async (req, res) => {
  if (enableLogging) console.info(JSON.stringify(req.body))
  const job = await enqueue(req.body)
  console.info(`Job ${job.id} enqueued.`);
  res.status(204);
})

const port = PORT || 8080

app.listen(port, async () => {
  const subscription = await subscribeWithFlowControl(PUBSUB_SUBSCRIPTION)
  subscription.on('message', messageHandler)
  console.log(`Listening on port :${port}`)
})
