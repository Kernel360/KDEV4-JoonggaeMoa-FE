import {dirname} from "path";
import {fileURLToPath} from "url";

import {fixupConfigRules, fixupPluginRules} from "@eslint/compat";
import {FlatCompat} from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import {defineConfig, globalIgnores} from "eslint/config";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    reactHooks.configs["recommended-latest"],
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },

            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",

            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },

        extends: fixupConfigRules(compat.extends(
            "eslint:recommended",
            "plugin:@typescript-eslint/recommended",
            "plugin:react/recommended",
            "plugin:react/jsx-runtime",
        )),

        plugins: {
            react: fixupPluginRules(reactPlugin),
            "react-refresh": reactRefresh,
            "import": importPlugin,
        },

        rules: {
            "react/prop-types": "off",
            "react/display-name": "off",

            "react-refresh/only-export-components": ["warn", {
                allowConstantExport: true,
            }],

            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-unused-expressions": "off",
            "@typescript-eslint/no-this-alias": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/ban-types": "off",
            "prefer-const": "warn",
            "no-undef": "off",
            "no-empty": "off",
            "no-unused-expressions": "off",
            "no-prototype-builtins": "off",
            "no-constant-condition": "off",
            "no-func-assign": "off",
            "no-cond-assign": "off",
            "no-useless-escape": "off",
            "no-case-declarations": "off",
            "no-inner-declarations": "off",
            "logical-assignment-operators": "off",
            "no-empty-static-block": "off",
            "no-new-native-nonconstructor": "off",

            "no-fallthrough": ["error", {
                commentPattern: "break[\\s\\w]*omitted",
            }],

            "import/order": ["warn", {
                "groups": ["builtin", "external", "internal", ["parent", "sibling", "index"]],
                "pathGroups": [
                    {
                        "pattern": "@/**",
                        "group": "internal"
                    }
                ],
                "pathGroupsExcludedImportTypes": ["builtin"],
                "alphabetize": {
                    "order": "asc",
                    "caseInsensitive": true
                },
                "newlines-between": "always"
            }],
            "import/no-unresolved": "error",
            "import/no-absolute-path": "error",
            "import/no-self-import": "error",
        },

        settings: {
            react: {
                version: "detect",
            },
            "import/resolver": {
                typescript: {
                    project: "./tsconfig.json"
                }
            }
        },
    }, globalIgnores([
        "**/node_modules",
        "node_modules/**/*",
        "**/node_modules/**/*",
        "**/dist",
        "dist/**/*",
        "**/dist/**/*",
        "**/build",
        "build/**/*",
        "**/*.min.js",
        "**/*.min.css",
        "vendor/**/*",
        "**/vendor/**/*",
        "**/bundle.js",
        "**/*.bundle.js",
        "**/*.generated.*",
        "**/.cursor",
        "**/coverage",
        "**/__tests__",
        "**/__mocks__",
        "**/vite.config.ts",
        "**/tsconfig.json",
        "**/tsconfig.node.json",
    ])]);