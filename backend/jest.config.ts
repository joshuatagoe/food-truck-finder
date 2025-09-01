// jest.config.ts
import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
  testMatch: ["**/?(*.)+(test|spec).[tj]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  clearMocks: true,
};

export default config;