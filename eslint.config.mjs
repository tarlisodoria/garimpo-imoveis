import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

// ESLint 10 removeu métodos antigos de SourceCode. Estas regras ainda os usam e
// quebram se forem ligadas: react/jsx-equals-spacing, react/jsx-tag-spacing,
// react/jsx-curly-spacing, react/jsx-one-expression-per-line e import/order.
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [".next/**", ".wrangler/**", "out/**", "coverage/**"],
  },
];

export default eslintConfig;
