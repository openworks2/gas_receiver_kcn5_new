'use strict'

const EventEmitter = require('events')

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter()

module.exports = myEmitter

const message1 = [
  {
    sensor_index: 'TEST-001',
    device_index: 1,
    value: {
      O2: 22.0,
      CO: 50.0,
      H2S: 50.1,
      VOC: 50.1,
      COMB: 50.1,
    },
  },
]

const message2 = [
  {
    sensor_index: 'TEST-002',
    device_index: 2,
    value: {
      O2: 22.0,
      CO: 50.0,
      H2S: 50.1,
      VOC: 50.1,
      COMB: 50.1,
    },
  },
]

function sendMessageEverySecond() {
  let o2Value = 20.0
  let coValue = 199.0

  setInterval(() => {
    if (o2Value <= 30.0) {
      message1[0].value.O2 = o2Value
      o2Value++
    }
    if (coValue <= 500.0) {
      message1[0].value.CO = coValue
      coValue++
    }
    myEmitter.emit('message', message1)
    myEmitter.emit('message', message2)
  }, 2000)
}

sendMessageEverySecond()
