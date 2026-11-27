import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  { ignores: ["out/**", "site/**", "node_modules/**"] },
];
