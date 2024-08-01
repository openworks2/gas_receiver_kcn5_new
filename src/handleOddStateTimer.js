'use strict'
const { releaseGasAlarm } = require('../lib/handleGasAlarm')
const { setGasState } = require('./cacheState')
// 5 minutes
const ODD_VALUE_TIMEOUT = 10 * 1000
const ODD_VALUE_TIMER_LIST = {}
const SITE_INDEX = process.env.SITE_INDEX

async function handleOddStateTimer(newState, gasCacheState) {
  const inAlarm = gasCacheState.inAlarmState
  // eslint-disable-next-line max-len
  const readyToResolve =
    !gasCacheState.state && (gasCacheState.sentDangerAlarmState || gasCacheState.sentWarnAlarmState)
  const cacheKey = newState.sensorIndex + '_' + newState.gasType
  const hasTimer = ODD_VALUE_TIMER_LIST[cacheKey]

  if (inAlarm && readyToResolve && !hasTimer) await setOddStateTimer(newState, gasCacheState)

  if (inAlarm && !readyToResolve && hasTimer) cancelOddStateTimer(cacheKey)
}

async function setOddStateTimer(newState, gasCacheState) {
  const cacheKey = newState.sensorIndex + '_' + newState.gasType

  ODD_VALUE_TIMER_LIST[cacheKey] = setTimeout(async () => {
    const data = {
      ...newState,
      recordTime: gasCacheState.recordTime,
      maxValue: gasCacheState.max_value,
      maxRecordTime: gasCacheState.max_record_time,
      restoreTime: gasCacheState.restoreTime,
      dangerRestoreTime: gasCacheState.dangerRestoreTime,
      warnRestoreTime: gasCacheState.warnRestoreTime,
      siteIndex: SITE_INDEX,
    }

    await releaseGasAlarm(data)

    // reset the state in Cache as normal
    const state = {
      state: 0,
      recordTime: null,
      restoreTime: null,
      sentSmsState: 0,
      sentDangerAlarmState: 0,
      sentWarnAlarmState: 0,
    }

    await setGasState(newState.sensorIndex, newState.gasType, state)

    delete ODD_VALUE_TIMER_LIST[cacheKey]
  }, ODD_VALUE_TIMEOUT)
}

function cancelOddStateTimer(cacheKey) {
  clearTimeout(ODD_VALUE_TIMER_LIST[cacheKey])
  delete ODD_VALUE_TIMER_LIST[cacheKey]
}

module.exports = { handleOddStateTimer }
