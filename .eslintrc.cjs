module.exports = {
  root: true,
  ignorePatterns: [".next/**", "node_modules/**", "out/**"],
  extends: ["next/core-web-vitals"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import"],
  rules: {
    "no-console": "error",
    "import/no-restricted-paths": [
      "error",
      {
        zones: [
          {
            target: "./src/app/board",
            from: "./src/store",
            message: "The board route may only receive the serialized board feed."
          },
          {
            target: "./src/app/board",
            from: "./src/types/patient",
            message: "The board route may not import the patient model."
          }
        ]
      }
    ]
  },
  overrides: [
    {
      files: ["src/lib/logger.ts"],
      rules: {
        "no-console": "off"
      }
    }
  ]
};
