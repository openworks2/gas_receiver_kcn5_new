'use strict'

/**
 * This module receives data from the gas sensor and processes it.
 * 
 * Steps:
 * 1. save raw data
 *  1-1. save raw data to MongoDB
 *  1-2. save raw data to Redis(ttl 1 min)
 *  1-3. logInsert every 30 mins (pick each device from Redis to SQS)

 * 2. resolve odd value
 *  2-1. check if value out of range
 *    2-1-1. set to Redis, set timeout 5 mins
 *    2-1-2. send sms, insert alarm(SQS)

 *  2-2. resolve out of range value after 5 mins
 *    2-2-1. delete key in Redis
 *    2-2-2. resolve alarm(SQS)
 */
const moment = require('moment-timezone')
const { insertRawDataToMongo } = require('../lib/mongoDB')
const checkState = require('../lib/checkState')
// const myEmitter = require('../lib/mock')
const { sendLogGasAlarmMQ } = require('../lib/sqs')
const { initGasState, getGasState, setGasState } = require('./cacheState')
// 5 minutes
const ODD_VALUE_TIMEOUT = 5 * 60 * 1000
const ODD_VALUE_TIMER_LIST = {}
const SITE_INDEX = 'SITE0001'

// for mock test
// myEmitter.on('message', (message) => {
//   receiver(message)
// })

// async function receiver(parsedBody) {
module.exports = async function receiver(parsedBody) {
  const data = parsedBody[0]

  data.created_at = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
  data.ts_index = SITE_INDEX

  // add raw data to mongoDB
  await insertRawDataToMongo(data)

  const rawData = {
    record_time: data.created_at,
    sensor_index: data.sensor_index,
    device_index: data.device_index,
  }

  for (const gasType in data.value) {
    const value = data.value[gasType]
    const sensorGasTypeIndex = data.sensor_index + '_' + gasType

    // init state of each gas to redis
    await initGasState(sensorGasTypeIndex)
    const state = await processSensorState(gasType, value, data.sensor_index)

    rawData[gasType.toLowerCase() + '_value'] = value
    rawData[gasType.toLowerCase() + '_state_code'] = state
  }

  // save log for each device as record
  await setGasState('record', data.sensor_index, rawData)
}

async function processSensorState(gasType, value, sensorIndex) {
  const { state, position } = checkState(gasType, value)
  const gasCacheState = await getGasState(sensorIndex, gasType)
  const newState = { sensorIndex, gasType, value, state, position }

  await handleOddState(newState, gasCacheState)

  await setGasState(sensorIndex, gasType, gasCacheState)

  const inAlarm = gasCacheState.inAlarmState
  const readyToResolve = !gasCacheState.state && gasCacheState.sentAlarmState
  const redisKey = newState.sensorIndex + '_' + newState.gasType
  const hasTimer = ODD_VALUE_TIMER_LIST[redisKey]

  if (inAlarm && readyToResolve && !hasTimer) {
    await handleOddStateTimer(newState, gasCacheState)
  }
  if (inAlarm && !readyToResolve && hasTimer) {
    clearTimeout(ODD_VALUE_TIMER_LIST[redisKey])
    delete ODD_VALUE_TIMER_LIST[redisKey]
  }

  if (newState.state) {
    gasCacheState.sentAlarmState = 1
    await setGasState(sensorIndex, gasType, gasCacheState)
  }

  return state
}

// cache value to redis by gas type
async function handleOddState(newState, gasCacheState) {
  // if gasCacheState is empty at first, initialize it
  if (!gasCacheState.value) {
    gasCacheState.value = newState.value
    gasCacheState.max_value = newState.value
    gasCacheState.max_record_time = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
  }

  // check if system ready to resolve after alarm happened
  if (newState.state) gasCacheState.inAlarmState = 1

  // if stage is high, replace the higher value, or if stage is low, replace the lower value
  const increase = newState.value >= gasCacheState.value

  if (newState.position === 'high' && increase) {
    gasCacheState.value = newState.value
    gasCacheState.max_value = newState.value
    gasCacheState.max_record_time = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
  } else if (newState.position === 'low' && !increase) {
    gasCacheState.value = newState.value
    gasCacheState.max_value = newState.value
    gasCacheState.max_record_time = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
  } else {
    gasCacheState.value = newState.value
  }

  gasCacheState.state = newState.state

  // if state is danger, and first time to send sms, set to 1
  if (newState.state === 2 && gasCacheState.sentSmsState === 0) {
    gasCacheState.sentSmsState = 1
  }

  // record time when first time to send alarm
  if (newState.state && gasCacheState.sentAlarmState === 0) {
    gasCacheState.recordTime = gasCacheState.recordTime
      ? gasCacheState.recordTime
      : moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
    const data = {
      ...newState,
      recordTime: gasCacheState.recordTime,
      sendSms: gasCacheState.sentSmsState,
    }

    await sendLogGasAlarmMQ(SITE_INDEX, data)
  }
}

// handle sensor state after odd value timeout
async function handleOddStateTimer(newState, gasCacheState) {
  const redisKey = newState.sensorIndex + '_' + newState.gasType

  ODD_VALUE_TIMER_LIST[redisKey] = setTimeout(async () => {
    const data = {
      ...newState,
      isRelease: 1,
      recordTime: gasCacheState.recordTime,
      maxValue: gasCacheState.max_value,
      maxRecordTime: gasCacheState.max_record_time,
      restoreTime: moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
    }

    console.info('resolve data: ', data)
    await sendLogGasAlarmMQ(SITE_INDEX, data)

    // reset the state in Redis as normal
    const state = {
      state: 0,
      recordTime: null,
      sentSmsState: 0,
      sentAlarmState: 0,
    }

    await setGasState(newState.sensorIndex, newState.gasType, state)

    delete ODD_VALUE_TIMER_LIST[redisKey]
  }, ODD_VALUE_TIMEOUT)
}
