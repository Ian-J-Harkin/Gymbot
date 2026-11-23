module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/evaluation/integration/**/*.integration.eval.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};