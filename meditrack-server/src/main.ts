import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload-ts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 5 }));

  const fallbackOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  const allowAllOrigins = configuredOrigins.includes('*');
  const explicitOrigins = configuredOrigins.filter((origin) => origin !== '*');

  if (!explicitOrigins.length && !allowAllOrigins) {
    explicitOrigins.push(fallbackOrigin);
  }

  const corsOriginOption = allowAllOrigins ? true : explicitOrigins;
  const allowCredentials = allowAllOrigins || explicitOrigins.length > 0;

  app.enableCors({
    origin: corsOriginOption,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: allowCredentials,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'apollo-require-preflight',
      'x-apollo-operation-name',
    ],
  });
  const port = process.env.PORT ?? 8000;
  await app.listen(port);
  console.log(`dYs? Application is running on: http://localhost:${port}/graphql`);
  const originLog = allowAllOrigins
    ? 'all origins (dynamic)'
    : explicitOrigins.join(', ');
  console.log(`dY"­ CORS enabled for origins: ${originLog}`);
}

bootstrap();
