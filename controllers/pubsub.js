const { PubSub } = require('@google-cloud/pubsub')
const pubsub = new PubSub()
const subscriptionNameOrId = process.env.PUBSUB_SUBSCRIPTION
const maxMessages = 3
const timeout = 10

/**
 * Provides PubSub interface
 * @param {Object} queue Bee worker queue instance
 * @returns 
 */
module.exports = function (queue) {
  return {
    async subscribeWithFlowControl () {
      const subscriberOptions = {
        flowControl: { maxMessages }
      }
      const subscription = pubsub.subscription(subscriptionNameOrId, subscriberOptions)
      console.log(`******* Listening for messages on ${subscription.name}.`)
      const messageHandler = (message) => {
        console.log(`******* Received message ${message.id}:`)
        console.log(`******* Data: ${message.data}`)
        console.log(`******* Attributes: ${message.attributes}`)
        queue.createJob(message.data).save()
        message.ack()
      }
      subscription.on('message', messageHandler)
      setTimeout(() => {
        subscription.close()
      }, timeout * 1000)
    },
    publish (message) {}
  }
}
