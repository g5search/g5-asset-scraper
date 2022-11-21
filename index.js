require('dotenv').config()
const express = require('express')
const app = express()
app.use(express.json({ limit: '1000kb' }))
const Scraper = require('./controllers/scraper')
const queue = require('./controllers/queue')()
const { subscribeWithFlowControl } = require('./controllers/pubsub')()

app.post('/', async (req, res) => {
  const { body } = req
  if (process.env.ENABLE_LOGGING) console.log(JSON.stringify(body))
  try {
    const scraper = new Scraper(body)
    await scraper.run()
    const results = scraper.results()
    if (process.env.ENABLE_LOGGING) console.log(JSON.stringify(results))
    res.json(results)
  } catch (error) {
    console.log(error)
    res.send(error.message)
  }
})

app.post('/enqueue', async (req, res) => {
  if (process.env.ENABLE_LOGGING) console.log(JSON.stringify(req.body))
  await queue.createJob(req.body).save()
  res.status(204).send('Created')
})

const port = process.env.PORT || 8080

app.listen(port, () => {
  subscribeWithFlowControl(queue)
  console.log(`Listening on port :${port}`)
  console.log(`Queue is ready: ${queue.name}: ${queue._isReady}`)
})
