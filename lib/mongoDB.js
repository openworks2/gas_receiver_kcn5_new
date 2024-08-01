'use strict'

const moment = require('moment-timezone')
const { MongoClient, ObjectId } = require('mongodb')

const uri = process.env.MONGO_URL || 'mongodb://localhost:27017'
const dbName = 'gasLog'
const collectionName = 'instant'

const client = new MongoClient(uri)
let collection

const connectToMongo = () => {
  try {
    client.connect()
    const db = client.db(dbName)

    collection = db.collection(collectionName)
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
  }
}

const insertRawDataToMongo = async (data) => {
  try {
    let expiresAt = new Date()

    expiresAt.setDate(expiresAt.getDate() + 2)
    expiresAt = moment(expiresAt).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')

    await collection.insertOne({ _id: new ObjectId(), expiresAt, ...data })
  } catch (error) {
    console.error('Error inserting data:', error)
  }
}

module.exports = { insertRawDataToMongo }

// Connect to MongoDB when the module is loaded
connectToMongo()
