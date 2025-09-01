jest.mock('./app', () => {
  const listen = jest.fn();
  return { createApp: jest.fn(() => ({ listen })) };
});

jest.mock('./db/migrate', () => ({
  ensureSchema: jest.fn(() => ({ /* fake db object */ })),
}));

test('starts server', async () => {
  process.env.NODE_ENV = 'production';

  const { createApp } = require('./app');
  const { ensureSchema } = require('./db/migrate');

  await import('./index'); // triggers the startup path

  expect(ensureSchema).toHaveBeenCalledTimes(1);
  expect(createApp).toHaveBeenCalledTimes(1);

  const app = (createApp as jest.Mock).mock.results[0].value;
  expect(app.listen).toHaveBeenCalled();

  expect(app.listen.mock.calls[0][0]).toBe(3000);
});
