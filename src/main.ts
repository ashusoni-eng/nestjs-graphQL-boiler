import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload-ts';

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
  app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 5 }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
