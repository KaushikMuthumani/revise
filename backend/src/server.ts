import app from './app.js';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Revise backend running on port ${PORT}`);
});
