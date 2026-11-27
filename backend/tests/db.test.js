const db = require('../src/db/knex');

afterAll(() => db.destroy());

test('las conexiones usan la hora de Argentina', async () => {
  const { rows } = await db.raw(
    `SELECT current_setting('TimeZone') AS zona,
            CURRENT_DATE = (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date AS misma_fecha`,
  );
  expect(rows[0]).toEqual({ zona: 'America/Argentina/Buenos_Aires', misma_fecha: true });
});
