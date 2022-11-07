const { PubSub } = require('@google-cloud/pubsub')
// const queue = require('./queue')()
const projectId = process.env.PROJECT_ID
const pubsub = new PubSub({ projectId })
const subscriptionNameOrId = process.env.PUBSUB_SUBSCRIPTION
const maxMessages = 3
const timeout = 10

/**
 * Provides PubSub interface
 * @param {Object} queue Bee worker queue instance
 * @returns 
 */
module.exports = function () {
  return {
    subscribeWithFlowControl (queue) {
      const subscriberOptions = {
        flowControl: { maxMessages }
      }
      const subscription = pubsub.subscription(subscriptionNameOrId, subscriberOptions)
      console.log(`******* Listening for messages on ${subscription.name}`)
      const messageHandler = (message) => {
        console.log(`******* Received message ${message.id}:`)
        console.log(`******* Data: ${message.data}`)
        console.log(`******* Attributes: ${message.attributes}`)
        console.log(`******* Queue is Ready: ${queue._isReady}`)
        try {
          let data
          data = Buffer.from(message.data, 'base64').toString().trim()
          data = JSON.parse(data)
          queue.createJob(data).save()
        } catch (error) {
          console.error(`******* Error: ${error}`)
        }
        message.ack()
      }
      subscription.on('message', messageHandler)
      setTimeout(() => {
        subscription.close()
      }, timeout * 1000)
    },
    async publish (message) {
      const dataBuffer = Buffer.from(JSON.stringify(message))
      
      try {
        const messageId = await pubsub.topic(process.env.PUBSUB_TOPIC).publishMessage(dataBuffer)
        console.log(`******* Message ${messageId} published.`)
      } catch (error) {
        
      }
    }
  }
}