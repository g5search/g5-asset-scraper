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
  if (!req.body) {
    const msg = 'no Pub/Sub message received'
    console.error(`error: ${msg}`)
    res.status(400).send(`Bad Request: ${msg}`)
    return
  }
  if (!req.body.message) {
    const msg = 'invalid Pub/Sub message format'
    console.error(`error: ${msg}`)
    res.status(400).send(`Bad Request: ${msg}`)
    return
  }
  
  const pubSubMessage = req.body.message
  let data
  try {
    data = Buffer.from(pubSubMessage.data, 'base64').toString().trim()
    data = JSON.parse(data)
    if (process.env.ENABLE_LOGGING) console.log(JSON.stringify(data))
    const scraper = new Scraper(data)
    await scraper.run()
    const results = scraper.results()
    if (process.env.ENABLE_LOGGING) console.log(JSON.stringify(results))
    res.status(204).json(results)
  } catch (error) {
    const msg = 'Invalid Pub/Sub message: data property is not valid base64 encoded JSON'
    console.error(`error: ${msg}: ${error}`)
    res.status(400).send(`Bad Request: ${msg}`)
    return
  }
  res.status(204).send()
})

app.post('/queue', async (req, res) => {
  queue.createJob(req.body).save()
  res.status(204).send('Created')
})

const port = process.env.PORT || 8080

app.listen(port, () => {
  subscribeWithFlowControl(queue)
  console.log(`Queue is ready: ${queue.name}: ${queue._isReady}`)
  console.log(`Listening on port :${port}`)
})
