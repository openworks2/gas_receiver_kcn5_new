'use strict'

require('dotenv').config()
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 50,
})

async function getConnection() {
  const connection = await pool.getConnection()

  return connection
}

module.exports = {
  getConnection,
  query: (...args) => pool.query(...args),
}
