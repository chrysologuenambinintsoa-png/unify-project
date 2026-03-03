/**
 * Use a different distDir to avoid permission issues on the default `.next` folder
 * Only apply it during development; production platforms such as Vercel expect `.next`.
 */
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  distDir: isProd ? '.next' : '.next_dev2'
};
