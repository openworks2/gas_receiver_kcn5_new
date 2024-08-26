'use strict'

const { findGasType } = require('../src/models')

async function checkState(gasType, value, sensorIndex) {
  const range = await findGasType(sensorIndex, gasType)

  if (!range) {
    throw new Error(`${sensorIndex}: ${gasType} range is undefined`)
  } else if (value < range.range_min || value > range.range_max) {
    console.error(`Value ${gasType}: ${value} is out of range`)
    value = Math.max(range.range_min, Math.min(value, range.range_max))
  }
  let data

  const states = [
    { from: 'normal_from', to: 'normal_to', state: 0, position: 'normal' },
    { from: 'danger_high_from', to: 'danger_high_to', state: 2, position: 'high' },
    { from: 'danger_low_from', to: 'danger_low_to', state: 2, position: 'low' },
    { from: 'warning_high_from', to: 'warning_high_to', state: 1, position: 'high' },
    { from: 'warning_low_from', to: 'warning_low_to', state: 1, position: 'low' },
  ]

  for (const { from, to, state, position } of states) {
    if (range[from] !== null && range[to] !== null) {
      if (value >= range[from] && value <= range[to]) {
        data = { state, position }
        break
      }
    }
  }

  return data
}

module.exports = checkState
