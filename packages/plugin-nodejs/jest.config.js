const base = require('@unional/devpkg-node/simple/config/jest.common')

module.exports = {
  ...base,
  displayName: 'plugin-nodejs',
  roots: [
    '<rootDir>/src'
  ]
}
