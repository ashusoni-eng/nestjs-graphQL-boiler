import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
  origin: [
    'https://studio.apollographql.com', // Apollo Sandbox
    'http://localhost:3000',            // local dev
    'http://localhost:4200'             // (if Angular/React frontend)
  ],
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
});
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
