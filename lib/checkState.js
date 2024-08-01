'use strict'

const gasRange = {
  O2: {
    min: 0.0,
    max: 30.0,
    danger_low_from: 0.0,
    danger_low_to: 18.9,
    warning_low_from: 19.0,
    warning_low_to: 19.4,
    normal_from: 19.5,
    normal_to: 23.5,
    warning_high_from: 23.6,
    warning_high_to: 24.5,
    danger_high_from: 24.6,
    danger_high_to: 30.0,
  },
  CO: {
    min: 0.0,
    max: 500.0,
    danger_low_from: 0.0,
    danger_low_to: 30.9,
    normal_from: 31.0,
    normal_to: 100.9,
    warning_high_from: 101.0,
    warning_high_to: 200.9,
    danger_high_from: 201.0,
    danger_high_to: 500.0,
  },
  H2S: {
    min: 0.0,
    max: 500.0,
    danger_low_from: 0.0,
    danger_low_to: 30.9,
    normal_from: 31.0,
    normal_to: 100.9,
    warning_high_from: 101.0,
    warning_high_to: 200.9,
    danger_high_from: 201.0,
    danger_high_to: 500.0,
  },
  VOC: {
    min: 0.0,
    max: 500.0,
    danger_low_from: 0.0,
    danger_low_to: 30.9,
    normal_from: 31.0,
    normal_to: 100.9,
    warning_high_from: 101.0,
    warning_high_to: 200.9,
    danger_high_from: 201.0,
    danger_high_to: 500.0,
  },
  COMB: {
    min: 0.0,
    max: 500.0,
    danger_low_from: 0.0,
    danger_low_to: 30.9,
    normal_from: 31.0,
    normal_to: 100.9,
    warning_high_from: 101.0,
    warning_high_to: 200.9,
    danger_high_from: 201.0,
    danger_high_to: 500.0,
  },
}

function checkState(gasType, value) {
  const range = gasRange[gasType]

  if (!range) {
    console.error(`No range defined for ${gasType}`)
    return
  }

  if (value < range.min || value > range.max) {
    console.error(`Value ${gasType}: ${value} is out of range`)

    return
  }
  let data = { state: 0, position: 'normal' }

  if (value < range.min || value > range.max) return data
  if (value >= range.danger_high_from && value <= range.danger_high_to) data = { state: 2, position: 'high' }
  if (value >= range.danger_low_from && value <= range.danger_low_to) data = { state: 2, position: 'low' }
  if (value >= range.warning_high_from && value <= range.warning_high_to) data = { state: 1, position: 'high' }
  if (value >= range.warning_low_from && value <= range.warning_low_to) data = { state: 1, position: 'low' }

  return data
}

module.exports = checkState
