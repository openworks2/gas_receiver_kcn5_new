'use strict'
const moment = require('moment-timezone')
const { startGasAlarm, updateGasAlarm } = require('../lib/handleGasAlarm')

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
  await handleSendAlarm(newState, gasCacheState)

  setRestoreTime(gasCacheState, newState)
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

async function handleSendAlarm(newState, gasCacheState) {
  if (newState.state) {
    const data = {
      ...newState,
      sendSms: gasCacheState.sentSmsState,
      siteIndex: SITE_INDEX,
    }

    const isNew = !gasCacheState.sentDangerAlarmState && !gasCacheState.sentWarnAlarmState

    if (isNew) {
      gasCacheState.recordTime = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
      data.recordTime = gasCacheState.recordTime
      await startGasAlarm({ ...data, alarmState: newState.state })
    }

    const isUpdate =
      (gasCacheState.sentDangerAlarmState && !gasCacheState.sentWarnAlarmState) ||
      (!gasCacheState.sentDangerAlarmState && gasCacheState.sentWarnAlarmState)

    if (isUpdate) {
      data.recordTime = gasCacheState.recordTime
      data.newRecordTime = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
      await updateGasAlarm({ ...data, alarmState: newState.state })
    }
  }
}

function setRestoreTime(gasCacheState, newState) {
  const timeNow = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')

  // if gas return to normal, set restore time with earliest time
  if (gasCacheState.inAlarmState && !newState.state) {
    if (gasCacheState.sentDangerAlarmState) {
      // eslint-disable-next-line max-len
      gasCacheState.dangerRestoreTime = gasCacheState.dangerRestoreTime ? gasCacheState.dangerRestoreTime : timeNow
    }
    if (gasCacheState.sentWarnAlarmState) {
      // eslint-disable-next-line max-len
      gasCacheState.warnRestoreTime = gasCacheState.warnRestoreTime ? gasCacheState.warnRestoreTime : timeNow
    }
    gasCacheState.restoreTime = gasCacheState.restoreTime ? gasCacheState.restoreTime : timeNow
  } else if (newState.state === 2) {
    // reset restore time if gas is in alarming
    gasCacheState.restoreTime = null
    gasCacheState.dangerRestoreTime = null
  } else if (newState.state === 1) {
    gasCacheState.restoreTime = null
    gasCacheState.warnRestoreTime = null
  }
}

exports.handleOddState = handleOddState
