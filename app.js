'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const dotenv = require('dotenv')

dotenv.config()
const receiver = require('./src/receiver')

require('./src/sendGasLog')

const app = express()

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.status(200).send('success!')
})

app.post('/receive', async (req, res) => {
  await receiver(req.body)
  res.end()
})

app.use((req, res) => {
  res.status(404).send('Not Found')
})

app.listen(80, () => {
  console.info('Server running on port 80')
})
