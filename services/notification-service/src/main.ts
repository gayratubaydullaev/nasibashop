import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SocketIoAdapter } from './socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new SocketIoAdapter(app));
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api', { exclude: ['health/(.*)'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 8087);
  await app.listen(port);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
