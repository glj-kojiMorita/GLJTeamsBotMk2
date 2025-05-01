// logger.js
const log4js = require('log4js');

log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    file: { type: 'file', filename: 'logs/app.log' }
  },
  categories: {
    default: { appenders: ['out', 'file'], level: 'debug' }
  }
});

module.exports = log4js.getLogger(); // ← 共通ロガーとして使えるようエクスポート

