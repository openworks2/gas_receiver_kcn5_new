'use strict'

const moment = require('moment-timezone')
const axios = require('axios')
const { findReceiverList, findSensor, findLocal, findGasTypeNormalRange } = require('../src/models')

async function sendSms(data) {
  const [receiverList, sensor, gasType] = await Promise.all([
    findReceiverList(data.siteIndex),
    findSensor(data.sensorIndex),
    findGasTypeNormalRange(data.sensorIndex, data.gasType),
  ])
  const local = await findLocal(sensor[0].local_index)

  for (const receiver of receiverList) {
    const sendObj = {
      name: receiver.wk_name,
      tel: receiver.wk_phone,
      record_time: moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
      sensor_name: sensor.sensor_name,
      gas_type: data.gasType,
      state_code: data.state,
      init_value: data.value,
      normal_range: `${gasType[0].normal_from}-${gasType[0].normal_to}${gasType[0].gas_unit}`,
      unit: gasType[0].gas_unit,
      local_name: sensor.sensor_name ?? local[0].local_name,
    }

    await send(sendObj)
  }
}

const send = async (sendObj) => {
  const url = `${process.env.SMS_SERVER}/alarm/iggas/danger`

  try {
    await axios.post(url, sendObj, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error(`Error sending SMS: ${error}`)
  }
}

module.exports = sendSms
