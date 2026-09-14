import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({ baseDirectory: fileURLToPath(new URL(".", import.meta.url)) });
const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "out/**", "coverage/**", "next-env.d.ts", "public/tesseract/*.js"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
