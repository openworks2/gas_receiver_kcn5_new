const AWS = require('aws-sdk')

// Configure AWS credentials and region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-northeast-2',
})

// Create an SQS service object
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' })

async function sendLogGasAlarmMQ(rawKey, data) {
  const params = {
    MessageBody: JSON.stringify({ key: rawKey, data }),
    QueueUrl: 'https://sqs.ap-northeast-2.amazonaws.com/211125308791/gasAlarmSQS',
  }

  try {
    await sqs.sendMessage(params).promise()
  } catch (err) {
    console.error('Error sending message to SQS:', err)
  }
}

async function sendLogGasMQ(rawKey, data) {
  const params = {
    MessageBody: JSON.stringify({ key: rawKey, data }),
    QueueUrl: 'https://sqs.ap-northeast-2.amazonaws.com/211125308791/gasRecordSQS',
  }

  try {
    await sqs.sendMessage(params).promise()
  } catch (err) {
    console.error('Error sending message to SQS:', err)
  }
}

module.exports = {
  sendLogGasAlarmMQ,
  sendLogGasMQ,
}
