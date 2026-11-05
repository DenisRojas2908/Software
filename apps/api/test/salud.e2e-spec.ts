import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app';

describe('GET /api/salud', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule.forRoot()] }).compile();
    app = configurarApp(modulo.createNestApplication());
    await app.init();
  });
  afterAll(() => app.close());

  it('F0: responde ok con el prefijo /api', async () => {
    const res = await request(app.getHttpServer()).get('/api/salud').expect(200);
    expect(res.body).toMatchObject({ estado: 'ok', simulacion: true });
  });
});
