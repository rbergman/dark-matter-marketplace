import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactCompiler from "eslint-plugin-react-compiler";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.res.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-compiler": reactCompiler,
    },
    rules: {
      // === REACT HOOKS (non-negotiable) ===
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // === REACT COMPILER ===
      "react-compiler/react-compiler": "error",

      // === COMPLEXITY LIMITS ===
      "complexity": ["error", { max: 15 }],
      "max-depth": ["error", 4],
      "max-lines-per-function": ["error", { max: 80, skipBlankLines: true, skipComments: true }],
      "max-lines": ["error", { max: 500, skipBlankLines: true, skipComments: true }],
      "max-params": ["error", 5],
      "max-nested-callbacks": ["error", 3],

      // === DISABLED (handled by ReScript compiler) ===
      "no-unused-vars": "off",  // ReScript handles this
      "no-undef": "off",        // ReScript handles this
    },
  },
];
