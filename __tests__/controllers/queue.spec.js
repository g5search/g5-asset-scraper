const { enqueue, messageHandler } = require('../../controllers/queue')

describe('enqueue', () => {
  test('it throws an error when no queue or data is provided', async () => {
    await expect(enqueue(null)).rejects.toThrowError({ message: 'No queue or data provided.' })
  })

  test('it creates a new job and returns it', async () => {
    const queue = { createJob: jest.fn(() => ({ timeout: jest.fn(() => ({ retries: jest.fn(() => ({ save: jest.fn(() => 'job') })) })) })) }
    const data = { some: 'data' }
    const job = await enqueue(queue, data)
    expect(queue.createJob).toHaveBeenCalledWith(data)
    expect(job).toBe('job')
  })

  test('it sets the timeout and retry values for the job', async () => {
    const job = { timeout: jest.fn(() => ({ retries: jest.fn(() => ({ save: jest.fn() })) })) }
    const queue = { createJob: jest.fn(() => job) }
    const data = { some: 'data' }
    await enqueue(queue, data)
    expect(job.timeout).toHaveBeenCalledWith(600000)
    expect(job.retries).toHaveBeenCalledWith(1)
  })
})

describe('messageHandler', () => {
  let mockMessage, mockEnqueue, mockConsoleLog, mockConsoleError

  beforeEach(() => {
    mockMessage = {
      id: '123',
      data: Buffer.from(JSON.stringify({ some: 'data' })).toString('base64'),
      ack: jest.fn()
    }
    mockEnqueue = jest.fn()
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    mockConsoleLog.mockRestore()
    mockConsoleError.mockRestore()
  })

  test('it logs the message when logging is enabled', () => {
    const mockEnableLogging = true
    messageHandler(mockMessage, mockEnqueue, mockEnableLogging)
    expect(mockConsoleLog).toHaveBeenCalledWith(`******* Received message ${mockMessage.id}:`)
  })

  test('it does not log the message when logging is disabled', () => {
    const mockEnableLogging = false
    messageHandler(mockMessage, mockEnqueue, mockEnableLogging)
    expect(mockConsoleLog).not.toHaveBeenCalled()
  })

  test('it parses the message data and enqueues the result', () => {
    const mockData = { some: 'data' }
    messageHandler(mockMessage, mockEnqueue, true)
    expect(mockEnqueue).toHaveBeenCalledWith(mockData)
  })

  test('it logs an error if parsing or enqueuing fails', () => {
    const mockError = new Error('Parsing error')
    jest.spyOn(JSON, 'parse').mockImplementationOnce(() => { throw mockError })
    messageHandler(mockMessage, mockEnqueue, true)
    expect(mockConsoleError).toHaveBeenCalledWith(`******* Error: ${mockError}`)
  })

  test('it acknowledges the message after processing', () => {
    messageHandler(mockMessage, mockEnqueue, true)
    expect(mockMessage.ack).toHaveBeenCalled()
  })
})
