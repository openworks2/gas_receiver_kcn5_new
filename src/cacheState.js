'use strict'
const redisClient = require('../lib/redis')

async function initGasState(index) {
  const result = await redisClient.get(index, (err) => {
    if (err) {
      console.error('Error reading data from Redis:', err)
      return
    }
  })

  if (result) return

  const state = {
    state: 0,
    sentSmsState: 0,
    sentAlarmState: 0,
  }

  await redisClient.set(index, JSON.stringify(state), (err) => {
    if (err) {
      console.error('Error writing data to Redis:', err)
    }
  })
}

async function getGasState(prefix, suffix) {
  const index = prefix + '_' + suffix

  const result = await redisClient.get(index, (err) => {
    if (err) {
      console.error('Error reading data from Redis:', err)
      return
    }
  })

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

  await redisClient.set(index, JSON.stringify(state), (err) => {
    if (err) {
      console.error('Error writing data to Redis:', err)
    }
  })
}

module.exports = { initGasState, getGasState, setGasState }
