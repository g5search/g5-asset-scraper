const enableLogging = process.env.ENABLE_LOGGING === 'true'
const { PubSub } = require('@google-cloud/pubsub')
const projectId = process.env.PROJECT_ID
const pubsub = new PubSub({ projectId })
const subscriptionNameOrId = process.env.PUBSUB_SUBSCRIPTION
const topicName = process.env.PUBSUB_TOPIC
const maxMessages = 3

/**
 * Publishes result as message to PubSub topic
 * @param {Object} message 
*/
const publish = async (message) => {
  try {
    if (!message) throw new Error({ message: 'No message provided.' })
    const dataBuffer = Buffer.from(JSON.stringify(message))
    const messageId = await pubsub.topic(topicName).publishMessage({ data: dataBuffer })
    console.info(`Publishing message to ${topicName}`, { message })
    if (enableLogging) console.info('Published message', { messageId })
    return messageId
  } catch (error) {
    console.error('Publish error', JSON.stringify(error.message));
    return error?.message
  }
}

/**
 * Initializes PubSub subscription and listens for messages
*/
const subscribeWithFlowControl = async () => {
  const subscriberOptions = {
    flowControl: { maxMessages }
  }
  const subscription = pubsub.subscription(subscriptionNameOrId, subscriberOptions)
  if (enableLogging) console.log(`******* Listening for messages on ${subscription.name}`)
  // not sure return is necessary
  return subscription
}

module.exports = { publish, subscribeWithFlowControl }
