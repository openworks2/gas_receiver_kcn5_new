const moment = require('moment-timezone')
const db = require('../util/db')

async function findGasType(key, gasType) {
  try {
    const query = `SELECT * FROM info_gastype WHERE sensor_index = ? AND gas_code = ?`
    const results = await db.query(query, [key, gasType])

    return results[0][0]
  } catch (error) {
    console.error('Error finding gas type:', error)
  }
}

async function insertRawData(data) {
  try {
    const query = `
      INSERT INTO log_gas (
          record_time, device_index, sensor_index, ts_index, 
          o2_value, h2s_value, co_value, voc_value, comb_value) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const values = [
      data.record_time,
      data.device_index,
      data.sensor_index,
      data.ts_index,
      data.value.O2,
      data.value.H2S,
      data.value.CO,
      data.value.VOC,
      data.value.COMB,
    ]

    await db.query(query, values)
  } catch (error) {
    console.error('Error inserting data:', error)
  }
}

async function updateInfoSensor(data) {
  try {
    const query = `
      UPDATE info_sensor
      SET 
        o2_value = ?, 
        o2_state_code = ?,
        h2s_value = ?, 
        h2s_state_code = ?,
        co_value = ?, 
        co_state_code = ?,
        voc_value = ?, 
        voc_state_code = ?,
        comb_value = ?,
        comb_state_code = ?,
        record_time = ?,
        sensor_action = ?
      WHERE sensor_index = ?;
    `

    const values = [
      data.o2_value,
      data.o2_state_code,
      data.h2s_value,
      data.h2s_state_code,
      data.co_value,
      data.co_state_code,
      data.voc_value,
      data.voc_state_code,
      data.comb_value,
      data.comb_state_code,
      data.record_time,
      // 0: OFF, 1: LOADING, 2: ON
      2,
      data.sensor_index,
    ]

    await db.query(query, values)
  } catch (error) {
    console.error('Error updating sensor:', error)
  }
}

async function releaseAlarm(data) {
  try {
    const query = `UPDATE log_gas_alarm
    SET restore_time = ?, dan_restore_time =?, max_record_time = ?, max_value = ?
    WHERE record_time = ? AND gas_type = ?`

    const values = [
      data.restoreTime,
      data.restoreTime,
      data.maxRecordTime,
      data.maxValue,
      data.recordTime,
      data.gasType,
    ]

    await db.query(query, values)
  } catch (error) {
    console.error('Error inserting data:', error)
  }
}

async function startAlarm(data) {
  try {
    const query = `INSERT INTO log_gas_alarm
    (
      record_time, dan_record_time, init_value, 
      state_code, gas_type, sensor_index, device_index
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)`

    // eslint-disable-next-line max-len
    const values = [data.recordTime, data.recordTime, data.value, data.state, data.gasType, data.sensorIndex, 1]

    await db.query(query, values)
  } catch (error) {
    console.error('Error inserting data:', error)
  }
}

async function updateInfoSensorAlarmState(data) {
  try {
    const type = data.gasType.toLowerCase()
    const query = `
      UPDATE info_sensor
      SET 
        action = ?, 
        sensor_state_code = ?,
        ${type}_value = ?, 
        ${type}_state_code = ?, 
        sensor_danger_action = ?, 
        sensor_danger_time = ?
      WHERE sensor_index = ?;
    `

    const { value, state, sensorIndex } = data
    const sensorState = state === 1 || state === 2 ? 2 : 0
    const dangerActionCode = state === 1 || state === 2 ? 1 : 0
    const time = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')

    const values = [1, sensorState, value, state, dangerActionCode, time, sensorIndex]

    await db.query(query, values)
  } catch (error) {
    console.error('Error updating sensor:', error)
  }
}

async function findReceiverList(key) {
  try {
    const query = `SELECT wk_name, wk_phone FROM info_worker WHERE wk_sms_yn = 1`
    const results = await db.query(query, [key])

    return results[0]
  } catch (error) {
    console.error('Error finding receiver list:', error)
  }
}

async function findSensor(key) {
  try {
    const query = `SELECT sensor_name, local_index FROM info_sensor WHERE sensor_index = ?`
    const results = await db.query(query, [key])

    return results[0]
  } catch (error) {
    console.error('Error finding sensor:', error)
  }
}

async function findAllSensors() {
  try {
    const query = `SELECT * FROM info_sensor`
    const results = await db.query(query)

    return results[0]
  } catch (error) {
    console.error('Error finding all sensors:', error)
  }
}

async function findLocal(index) {
  try {
    const query = `SELECT local_name FROM info_local WHERE local_index = ?`
    const results = await db.query(query, [index])

    return results[0]
  } catch (error) {
    console.error('Error finding local:', error)
  }
}

async function findGasTypeNormalRange(key, gasType) {
  try {
    // eslint-disable-next-line max-len
    const query = `SELECT normal_from, normal_to, gas_unit FROM info_gastype WHERE sensor_index = ? AND gas_code = ?`
    const results = await db.query(query, [key, gasType])

    return results[0]
  } catch (error) {
    console.error('Error finding gas type:', error)
  }
}

async function insertLog(data) {
  try {
    const query = `INSERT INTO sensor_record
    (
      record_time, device_index, sensor_index, 
      o2_value, o2_state_code, 
      h2s_value, h2s_state_code, 
      co_value, co_state_code, 
      voc_value, voc_state_code, 
      comb_value, comb_state_code
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    const values = [
      new Date(data.record_time),
      data.device_index,
      data.sensor_index,
      data.o2_value,
      data.o2_state_code,
      data.h2s_value,
      data.h2s_state_code,
      data.co_value,
      data.co_state_code,
      data.voc_value,
      data.voc_state_code,
      data.comb_value,
      data.comb_state_code,
    ]

    await db.query(query, values)
  } catch (error) {
    console.error('Error inserting log:', error)
  }
}

async function offSensorAction(index) {
  try {
    const query = `
      UPDATE info_sensor
      SET sensor_action = ?, 
          o2_value = ?, 
          o2_state_code = ?, 
          h2s_value = ?, 
          h2s_state_code = ?, 
          co_value = ?, 
          co_state_code = ?, 
          voc_value = ?, 
          voc_state_code = ?, 
          comb_value = ?, 
          comb_state_code = ?
      WHERE sensor_index = ?;
    `

    const values = [0, null, null, null, null, null, null, null, null, null, null, index]

    await db.query(query, values)
  } catch (error) {
    console.error('Error updating sensor:', error)
  }
}

module.exports = {
  insertRawData,
  updateInfoSensor,
  releaseAlarm,
  startAlarm,
  updateInfoSensorAlarmState,
  findReceiverList,
  findSensor,
  findAllSensors,
  findLocal,
  findGasType,
  findGasTypeNormalRange,
  insertLog,
  offSensorAction,
}
