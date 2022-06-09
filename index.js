require('dotenv').config()
const express = require('express')
const app = express()
app.use(express.json({ limit: '1000kb' }))
const Scraper = require('./scraper')

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

const port = process.env.PORT || 8080

app.listen(port, () => {
  console.log(`Listening on port :${port}`)
})
