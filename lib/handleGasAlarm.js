'use strict'

const { releaseAlarm, startAlarm, updateInfoSensorAlarmState } = require('../src/models')
const sendSms = require('./sendSms')
const handleGasAlarm = async (data) => {
  if (data.isRelease) {
    await releaseAlarm(data)
  } else {
    await startAlarm(data)
  }
  await updateInfoSensorAlarmState(data)

  if (data.sendSms) await sendSms(data)
}

module.exports = { handleGasAlarm }
