const base = require('../../jest.config.node-base')

module.exports = {
  ...base,
  displayName: 'io-local',
  moduleNameMapper: {
    '@mocktomata/(plugin-fixture-deep-link.*)': '<rootDir>/../$1',
    '@mocktomata/(.*)': '<rootDir>/../$1/src'
  }
}
