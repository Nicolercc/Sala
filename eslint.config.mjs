import nextVitals from "eslint-config-next/core-web-vitals";

const boardBoundary = [
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
      },
      {
        target: "./src/components/BoardDisplay.tsx",
        from: "./src/store",
        message: "The board renderer may only receive the serialized board feed."
      },
      {
        target: "./src/components/BoardDisplay.tsx",
        from: "./src/types/patient",
        message: "The board renderer may not import the patient model."
      }
    ]
  }
];

const eslintConfig = [
  ...nextVitals,
  { ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"] },
  {
    rules: {
      "no-console": "error",
      "import/no-restricted-paths": boardBoundary
    }
  },
  {
    files: ["src/lib/logger.ts"],
    rules: { "no-console": "off" }
  }
];

export default eslintConfig;
