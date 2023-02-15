module.exports = {
  clearMocks: true,
  collectCoverage: true,
  'testMatch': [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[tj]s?(x)',
    '!**/__tests__/config/**',
  ],
  'testPathIgnorePatterns': [
    '__tests__/config/'
  ],
  collectCoverageFrom: [
    '<rootDir>/*.js',
    '<rootDir>/**/*.js',
    '<rootDir>/index.js',
    '!<rootDir>/jest.config.js',
    '!<rootDir>/__tests__/**',
    '!<rootDir>/coverage/**'
  ]
}