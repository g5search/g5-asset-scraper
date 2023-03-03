const pubsub = require('../../controllers/pubsub')()
process.env.ENABLE_LOGGING = 'true'
const mockQueue = jest.fn()

describe('controllers/pubsub', () => {
  it('should subscribe but not enqueue', () => {
    pubsub.subscribeWithFlowControl(mockQueue)
    expect(mockQueue).not.toHaveBeenCalled()
  })

  it('should publish', async () => {
    const mockMessage = { foo: 'bar' }
    const messageId = await pubsub.publish(mockMessage)
    expect(messageId).toBeDefined()
  })

  it('should return an error if no params are passed', async () => {
    const error = await pubsub.publish()
    expect(error).toBeDefined()
  })
})
