module.exports = {
  testEnvironment: "jsdom",
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/.claude/worktrees/",
    "<rootDir>/e2e/"
  ],
  transform: {
    "^.+\\.jsx?$": "babel-jest"
  },
  moduleFileExtensions: ["js", "jsx"],
  extensionsToTreatAsEsm: [".jsx"],
  transformIgnorePatterns: [
    "node_modules/(?!(your-esm-module)/)"
  ],
  moduleNameMapper: {
    "\\.svg$": "<rootDir>/__mocks__/fileMock.js"
  },
  setupFiles: ["./jest.setup.js"],
  setupFilesAfterEnv: ["@testing-library/jest-dom"]
};