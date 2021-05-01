const proxy = require('koa-proxies');

module.exports = {
  port: 9000,
  middlewares: [
    proxy('/server', {
      target: 'http://localhost:8080',
    }),
  ],
};
