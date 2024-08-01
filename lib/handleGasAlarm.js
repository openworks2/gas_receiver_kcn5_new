'use strict'

const { releaseAlarm, startAlarm, updateAlarm, updateInfoSensorAlarmState } = require('../src/models')
const sendSms = require('./sendSms')
const startGasAlarm = async (data) => {
  await startAlarm(data)
  await updateInfoSensorAlarmState(data)

  if (data.sendSms) await sendSms(data)
}

const updateGasAlarm = async (data) => {
  await updateAlarm(data)
  await updateInfoSensorAlarmState(data)
}

const releaseGasAlarm = async (data) => {
  await releaseAlarm(data)
}

module.exports = { startGasAlarm, updateGasAlarm, releaseGasAlarm }
