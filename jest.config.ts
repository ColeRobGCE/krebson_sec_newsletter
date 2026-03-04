import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^feedsmith$': '<rootDir>/node_modules/feedsmith/dist/index.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm/)?(feedsmith|entities|fast-xml-parser)(@[^/]+)?/)',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: false }],
    '^.+feedsmith.+\\.js$': ['ts-jest', { useESM: false }],
    '^.+entities.+\\.js$': ['ts-jest', { useESM: false }],
    '^.+fast-xml-parser.+\\.js$': ['ts-jest', { useESM: false }],
  },
};

export default config;
