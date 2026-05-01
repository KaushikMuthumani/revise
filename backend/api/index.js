import app from '../dist/app.js';

let readyPromise;

export default async function handler(req, res) {
  readyPromise ??= app.ready();
  await readyPromise;
  app.server.emit('request', req, res);
}
