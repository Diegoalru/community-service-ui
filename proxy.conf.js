require('dotenv').config();
const process = require('process');

const PROXY_CONFIG = [
  {
    context: [
      "/api",
    ],
    target: process.env.BACKEND_URL,
    secure: false,
    changeOrigin: true,
    logLevel: "debug"
  }
]

module.exports = PROXY_CONFIG;
