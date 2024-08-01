'use strict'
const moment = require('moment-timezone')
const { handleGasAlarm } = require('../lib/handleGasAlarm')

const SITE_INDEX = process.env.SITE_INDEX

// cache value to cache by gas type
async function handleOddState(newState, gasCacheState) {
  // initialize value with first income value
  // eslint-disable-next-line eqeqeq
  if (gasCacheState.value == null) updateGasCacheState(gasCacheState, newState)

  // inAlarmState is for check if the gas is in alarming, use for handling timer
  if (newState.state) gasCacheState.inAlarmState = 1

  const isChange = checkValueChange(newState, gasCacheState)

  if (isChange) updateGasCacheState(gasCacheState, newState)

  gasCacheState.state = newState.state

  // if state is danger, and first time to send sms, set to 1
  const isSendSms = newState.state && gasCacheState.sentSmsState === 0

  if (isSendSms) gasCacheState.sentSmsState = 1

  // handle sensor state after odd value timeout
  await handleInitialAlarm(newState, gasCacheState)

  handleRestoreTime(gasCacheState, newState)
}

function updateGasCacheState(gasCacheState, newState) {
  gasCacheState.value = newState.value
  gasCacheState.max_value = newState.value
  gasCacheState.max_record_time = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
}

function checkValueChange(newState, gasCacheState) {
  // if stage is high, replace the higher value, or if stage is low, replace the lower value
  return (
    (newState.position === 'high' && newState.value > gasCacheState.value) ||
    (newState.position === 'low' && newState.value < gasCacheState.value)
  )
}

async function handleInitialAlarm(newState, gasCacheState) {
  // send alarm only once by checking sentAlarmState
  const initSendAlarm = newState.state && !gasCacheState.sentAlarmState

  if (initSendAlarm) {
    gasCacheState.recordTime = gasCacheState.recordTime
      ? gasCacheState.recordTime
      : moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
    const data = {
      ...newState,
      recordTime: gasCacheState.recordTime,
      sendSms: gasCacheState.sentSmsState,
      siteIndex: SITE_INDEX,
    }

    await handleGasAlarm(data)
  }
}

function handleRestoreTime(gasCacheState, newState) {
  // if gas return to normal, set restore time with earliest time
  if (gasCacheState.inAlarmState && !newState.state) {
    gasCacheState.restoreTime = gasCacheState.restoreTime
      ? gasCacheState.restoreTime
      : moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
  } else {
    // reset restore time if gas is in alarming
    gasCacheState.restoreTime = null
  }
}

exports.handleOddState = handleOddState
