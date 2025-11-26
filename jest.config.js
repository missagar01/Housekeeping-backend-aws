/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleFileExtensions: ['js'],
  setupFiles: ['<rootDir>/test/setupEnv.js'],
  clearMocks: true
};
