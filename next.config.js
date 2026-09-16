const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin explicitly — /home/ubuntu has an unrelated bun.lock one level up that
  // Next otherwise misdetects as the workspace root.
  outputFileTracingRoot: path.join(__dirname),
};
module.exports = nextConfig;
