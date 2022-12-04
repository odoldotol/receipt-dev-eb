import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const bootstrap = async () => { // async function bootstrap() {
  const app = await NestFactory.create(AppModule)
    .then(app => {
      console.log(`MongoDB Connected on ${process.env.MONGO_database}`);
      return app;
    })

  app.enableCors({
      origin: 'https://receipt-dev.vercel.app',
      credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  await app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    console.log(`MongoDB Connected on ${process.env.MONGO_database}`);
  });
}
bootstrap();