'use strict'
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const receiver = require('./src/receiver')

require('dotenv').config()
require('./src/sendGasLog')

const app = express()

app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.status(200).send('success!')
})

app.post('/receive/status/iaq700', async (req, res) => {
  await receiver(req.body)
  res.end()
})

app.use((req, res) => {
  res.status(404).send('Not Found')
})

app.listen(process.env.PORT || 80, () => {
  console.info(`Server running on port ${process.env.PORT || 80}`)
})
