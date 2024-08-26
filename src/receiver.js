'use strict'

const moment = require('moment-timezone')
const { updateInfoSensor } = require('../src/models')
const checkState = require('../lib/checkState')

module.exports = async function receiver(parsedBody) {
  const data = parsedBody[0]

  data.record_time = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')

  const gasInfo = {
    record_time: data.record_time,
    sensor_index: data.sensor_index,
    device_index: data.device_index,
  }

  for (const gasType in data.value) {
    const value = data.value[gasType]
    const { state } = await checkState(gasType, value, data.sensor_index)

    gasInfo[gasType.toLowerCase() + '_value'] = value
    gasInfo[gasType.toLowerCase() + '_state_code'] = state
  }

  await updateInfoSensor(gasInfo)
}
