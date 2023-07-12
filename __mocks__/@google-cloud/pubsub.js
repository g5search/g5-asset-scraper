//pubsub.js
class PubSubMock {
  static mockInstances = [];

  static clearAllMocks() {
    PubSubMock.mockInstances.forEach((instance) =>
      Object.getOwnPropertyNames(
        instance.constructor.prototype
      ).forEach((method) => method.mockClear())
    );
    
    PubSubMock.mockInstances.length = 0;
  }

  constructor() {
    Object
      .getOwnPropertyNames(this.constructor.prototype)
      .forEach((method) => {
        jest.spyOn(this, method)
    })

    PubSubMock.mockInstances.push(this)
  }

  topic(topic) {
    // you can implement here the logic
    return this
  }

  subscription(id, options) {
    return {
      name: 'mockedSubscription',
      on: jest.fn()
    }
  }

  publish(body, obj) {
    return this;
  }
}

module.exports.PubSub = PubSubMock;