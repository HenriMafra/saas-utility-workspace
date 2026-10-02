import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Aspas literais em texto JSX são HTML válido; regra estilística desligada.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      "node_modules/**",
      "supabase/functions/**", // Deno runtime, lint à parte
      "tests/e2e/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default eslintConfig;
