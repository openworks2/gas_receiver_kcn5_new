'use strict'

/**
 * This module receives data from the gas sensor and processes it.
 *
 * Steps:
 * 1. save raw data
 *  1-1. save raw data to MongoDB
 *  1-2. save raw data to Cache(ttl 1 min)
 *  1-3. logInsert every 30 mins
 * 2. resolve odd value
 *  2-1. check if value out of range
 *    2-1-1. set to Cache, set timeout 5 mins
 *    2-1-2. send sms, insert alarm
 *  2-2. resolve out of range value after 5 mins
 *    2-2-1. delete key in Cache
 *    2-2-2. resolve alarm
 */
const moment = require('moment-timezone')
const { insertRawData, updateInfoSensor } = require('../src/models')
const checkState = require('../lib/checkState')
const { initGasState, getGasState, setGasState } = require('./cacheState')
const { handleOddState } = require('./handleOddState')
const { handleOddStateTimer } = require('./handleOddStateTimer')
const SITE_INDEX = process.env.SITE_INDEX
// for mock test
// myEmitter.on('message', (message) => {
//   receiver(message)
// })

// async function receiver(parsedBody) {
module.exports = async function receiver(parsedBody) {
  const data = parsedBody[0]

  data.record_time = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
  data.ts_index = SITE_INDEX

  // add raw data to db
  await insertRawData(data)

  const gasInfo = {
    record_time: data.record_time,
    sensor_index: data.sensor_index,
    device_index: data.device_index,
  }

  for (const gasType in data.value) {
    const value = data.value[gasType]
    const sensorGasTypeIndex = data.sensor_index + '_' + gasType

    // init state of each gas to cache
    await initGasState(sensorGasTypeIndex)
    const state = await processSensorState(gasType, value, data.sensor_index)

    gasInfo[gasType.toLowerCase() + '_value'] = value
    gasInfo[gasType.toLowerCase() + '_state_code'] = state
  }

  // update gas value in sensor info
  await updateInfoSensor(gasInfo)

  // save log for each device as record
  await setGasState('record', data.sensor_index, gasInfo)
}

async function processSensorState(gasType, value, sensorIndex) {
  const { state, position } = await checkState(gasType, value, sensorIndex)
  const gasCacheState = await getGasState(sensorIndex, gasType)
  const newState = { sensorIndex, gasType, value, state, position }

  await handleOddState(newState, gasCacheState)

  await setGasState(sensorIndex, gasType, gasCacheState)

  await handleOddStateTimer(newState, gasCacheState)

  if (newState.state) {
    // if alarm has occurred, mark it to avoid send alarm again
    if (newState.state === 2) gasCacheState.sentDangerAlarmState = 1
    else if (newState.state === 1) gasCacheState.sentWarnAlarmState = 1
    await setGasState(sensorIndex, gasType, gasCacheState)
  }

  return state
}
