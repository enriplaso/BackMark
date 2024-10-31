// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(eslint.configs.recommended, prettier, ...tseslint.configs.recommendedTypeChecked, {
    ignores: ['dist', 'node_modules'],
    files: ['src/**/*.ts', 'eslint.config.js'],
    languageOptions: {
        parserOptions: {
            project: true,
            tsconfigRootDir: import.meta.dirname,
        },
    },
});
