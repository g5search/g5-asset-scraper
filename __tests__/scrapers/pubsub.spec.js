const pubsub = require('../../controllers/pubsub')()

describe('PubSub', () => {
  describe('.subscribeWithFlowControl', () => {
    it('should subscribe to a PubSub topic', () => {
      const queue = {
        _isReady: true,
        createJob: jest.fn()
      }
      pubsub.subscribeWithFlowControl(queue)
      expect()
    })
  })
  describe('.publish', () => {})
})