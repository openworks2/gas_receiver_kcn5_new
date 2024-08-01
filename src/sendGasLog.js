'use strict'

const moment = require('moment-timezone')
const cron = require('node-cron')
const { getAllGasState, getGasState } = require('./cacheState')
const { insertLog, offSensorAction, findAllSensors } = require('./models')

// send sensor record by schedule
const sendGasLog = async (now) => {
  try {
    const caches = await getAllGasState()

    for (const key of Object.keys(caches)) {
      const prefix = key.split('_')[0]
      const rawKey = key.split('_')[1]

      if (prefix === 'record') {
        const data = await getGasState(prefix, rawKey)

        if (moment(now).diff(moment(data.record_time), 'minutes') > 30) continue
        data.record_time = now

        await insertLog(data)
      }
    }
  } catch (error) {
    console.error('Error fetching from Redis:', error)
  }
}

const checkSensorState = async () => {
  const sensors = await findAllSensors()

  for (const sensor of sensors) {
    const recordTime = moment(sensor.record_time, 'YYYY-MM-DD HH:mm:ss')
    const currentTime = moment().tz('Asia/Seoul')
    const diffMinutes = currentTime.diff(recordTime, 'minutes')

    // if record_time not update more than 5 minutes, set sensor_action to OFF
    // 0: OFF, 1: LOADING, 2: ON
    if (diffMinutes > 5) await offSensorAction(sensor.sensor_index)
  }
}

// schedule every 30 minutes
cron.schedule('0,30 * * * *', () => {
  const now = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')

  sendGasLog(now)
})

// schedule every 1 minutes
cron.schedule('*/1 * * * *', () => {
  checkSensorState()
})
