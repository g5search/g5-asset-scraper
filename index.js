require('dotenv').config()
const express = require('express')
const app = express()
app.use(express.json({ limit: '1000kb' }))
const Scraper = require('./scraper')

app.get('/', (req, res) => {
  res.send('Yes, I am listening.')
})

app.post('/', async (req, res) => {
  const { body } = req
  try {
    const scraper = new Scraper(body)
    await scraper.run()
    const results = scraper.results()
    res.json(results)
  } catch (error) {
    console.log(error)
    res.status(422).send(error.message)
  }
})

const port = process.env.PORT || 8080

app.listen(port, () => {
  console.log(`Listening on port :${port}`)
})
