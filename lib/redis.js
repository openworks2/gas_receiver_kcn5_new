'use strict'

const redis = require('redis')

const redisClient = redis.createClient({
  host: 'redis',
  port: 6379,
})

redisClient.on('error', (err) => console.error('Redis client Error', err))

redisClient
  .connect()
  .then(() => {
    console.info('Connected to Redis...')

    // Flush all data from Redis
    redisClient
      .flushAll()
      .then((succeeded) => {
        console.info(succeeded)
      })
      .catch((err) => {
        console.error('Error flushing Redis:', err)
      })

    // Proceed with your server setup here
  })
  .catch((err) => {
    console.error('Failed to connect to Redis:', err)
  })

module.exports = redisClient
