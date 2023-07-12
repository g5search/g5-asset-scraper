const cld = require('../../controllers/cloudinary')

describe('Cloudinary controller', () => {
  it('exits if no URL is provided', async () => {
    const result = await cld.upload({})
    expect(result).toBeUndefined()
  })
})