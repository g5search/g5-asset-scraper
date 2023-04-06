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

app.listen(port, async () => {
  const subscription = await subscribeWithFlowControl(queue)
  subscription.on('message', messageHandler)
  console.log(`Listening on port :${port}`)
})
