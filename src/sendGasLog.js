'use strict'

const moment = require('moment-timezone')
const redisClient = require('../lib/redis')
const { sendLogGasMQ } = require('../lib/sqs')
// 30 minutes
const INSERT_LOG_INTERVAL = 30 * 60 * 1000

// send sensor record by schedule
const sendGasLog = async () => {
  try {
    const keys = await redisClient.keys('*')

    for (const key of keys) {
      const prefix = key.split('_')[0]
      const rawKey = key.split('_')[1]

      if (prefix === 'record') {
        const data = JSON.parse(await redisClient.get(key))
        const recordTime = moment(data.record_time, 'YYYY-MM-DD HH:mm:ss')
        const currentTime = moment().tz('Asia/Seoul')
        const diffMinutes = currentTime.diff(recordTime, 'minutes')

        data.sensor_action = diffMinutes > 5 ? 2 : 1
        await sendLogGasMQ(rawKey, data)
      }
    }
  } catch (error) {
    console.error('Error fetching from Redis:', error)
  }
}

setInterval(() => {
  sendGasLog()
}, INSERT_LOG_INTERVAL)
