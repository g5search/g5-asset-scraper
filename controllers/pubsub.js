const enableLogging = process.env.ENABLE_LOGGING === 'true'
const { PubSub } = require('@google-cloud/pubsub')
const projectId = process.env.PROJECT_ID
const pubsub = new PubSub({ projectId })
const subscriptionNameOrId = process.env.PUBSUB_SUBSCRIPTION
const topicName = process.env.PUBSUB_TOPIC
const maxMessages = 3

/**
 * Provides PubSub interface
 * @param {Object} queue Bee worker queue instance
 * @returns 
 */
module.exports = function () {
  return {
    /**
     * Initializes PubSub subscription and listens for messages
     * @param {Object} queue 
     */
    subscribeWithFlowControl (queue) {
      const subscriberOptions = {
        flowControl: { maxMessages }
      }
      const subscription = pubsub.subscription(subscriptionNameOrId, subscriberOptions)
      if (enableLogging) console.log(`******* Listening for messages on ${subscription.name}`)
      const messageHandler = (message) => {
        if (enableLogging) console.log(`******* Received message ${message.id}:`)
        if (enableLogging) console.log(`******* Data: ${message.data}`)
        if (enableLogging) console.log(`******* Queue is Ready: ${queue._isReady}`)
        try {
          let data
          data = Buffer.from(message.data, 'base64').toString().trim()
          data = JSON.parse(data)
          queue.createJob(data).save()
        } catch (error) {
          console.error(`******* Error: ${error}`)
          message.ack()
        }
        message.ack()
      }
      subscription.on('message', messageHandler)
    },

    /**
     * Publishes result as message to PubSub topic
     * @param {Object} message 
     */
    async publish (message) {
      const dataBuffer = Buffer.from(JSON.stringify(message))
      
      try {
        const messageId = await pubsub.topic(topicName).publishMessage({ data: dataBuffer })
        if (enableLogging) console.log(`******* Message ${messageId} published.`)
        return messageId
      } catch (error) {
        console.error(`******* Received error while publishing: ${error.message}`)
      }
    }
  }
}

// test the pubsub controller with jest

