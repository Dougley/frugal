import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import vitest from "@vitest/eslint-plugin";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  // Global ignores
  {
    ignores: [
      "**/i18n/**",
      "**/.react-router/**",
      "**/.vite/**",
      "**/.wrangler/**",
      "**/worker-configuration.d.ts",
      "**/*.d.ts",
      "**/*.config.{js,cjs,mjs,ts,cts,mts}",
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/.next/**",
      "**/coverage/**",
      "**/.nyc_output/**",
      "**/public/build/**",
      "**/eslint_report.json",
    ],
  },

  // Base config for all JavaScript/TypeScript files
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // TypeScript-specific config
  {
    files: ["**/*.{ts,tsx,cts,mts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: true,
        noWarnOnMultipleProjects: true,
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      import: importPlugin,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      // Turn off base rules that are covered by TypeScript
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-undef": "off", // TypeScript handles this
      // Import plugin rules
      "import/no-unresolved": "off", // TypeScript handles this
      "import/named": "error",
      "import/default": "error",
      "import/export": "error",
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: ["apps/*/tsconfig.json", "packages/*/tsconfig.json"],
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
  },

  // React-specific config
  {
    files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
    },
    settings: {
      react: {
        version: "detect",
      },
      formComponents: ["Form"],
      linkComponents: [
        { name: "Link", linkAttribute: "to" },
        { name: "NavLink", linkAttribute: "to" },
      ],
    },
  },

  // Vitest test files config
  {
    files: [
      "**/*.{test,spec}.{js,jsx,ts,tsx}",
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
    ],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },

  // Node.js specific files
  {
    files: [
      "**/*.{cjs,mjs}",
      "**/eslint.config.{js,cjs,mjs}",
      "**/vite.config.{js,ts}",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Prettier compatibility - must be last
  prettier,
];
