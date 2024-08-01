'use strict'

const cache = {}

async function initGasState(index) {
  const result = cache[index]

  if (result) return

  const state = {
    state: 0,
    sentSmsState: 0,
    sentAlarmState: 0,
  }

  cache[index] = JSON.stringify(state)
}

async function getAllGasState() {
  return cache
}

async function getGasState(prefix, suffix) {
  const index = prefix + '_' + suffix

  const result = cache[index]

  let gasTypeCacheState

  if (result) gasTypeCacheState = JSON.parse(result)
  else {
    console.error('No state found for', prefix, suffix)
    return
  }

  return gasTypeCacheState
}

async function setGasState(prefix, suffix, state) {
  const index = prefix + '_' + suffix

  cache[index] = JSON.stringify(state)

  cache
}

module.exports = { initGasState, getAllGasState, getGasState, setGasState }
