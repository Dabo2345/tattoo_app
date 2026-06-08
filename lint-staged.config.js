/** @type {import('lint-staged').Config} */
const config = {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,mjs,cjs}": ["prettier --write"],
  "*.{json,md,css}": ["prettier --write"],
}

export default config
