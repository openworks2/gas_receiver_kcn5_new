const db = require('../util/db')

async function findGasType(key, gasType) {
  try {
    const query = `SELECT * FROM info_gas WHERE sensor_index = ? AND gas_code = ?`
    const results = await db.query(query, [key, gasType])

    return results[0][0]
  } catch (error) {
    console.error('Error finding gas type:', error)
  }
}

async function insertRawData(data) {
  try {
    const query = `
      INSERT INTO sensor_log (
        record_time, 
        device_index, 
        sensor_index, 
        o2_value,
        o2_state_code,
        h2s_value,
        h2s_state_code,
        co_value,
        co_state_code,
        voc_value,
        voc_state_code,
        comb_value,
        comb_state_code
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const values = [
      data.record_time,
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

module.exports = {
  updateInfoSensor,
  insertRawData,
  findGasType,
}
