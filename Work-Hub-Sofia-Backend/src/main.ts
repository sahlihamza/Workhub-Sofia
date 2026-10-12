import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { PlanningService } from './planning/planning.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const planningService = app.get(PlanningService);

  // ✅ Active les pipes de validation avant de démarrer l'app
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ignore les propriétés non définies dans le DTO
      forbidNonWhitelisted: true, // lève une erreur si des propriétés non autorisées sont envoyées
      transform: true, // transforme automatiquement les types (ex: string en number)
      skipMissingProperties: true,
    }),
  );

   app.enableCors({
    origin: 'http://localhost:4200',  // autorise uniquement ton frontend Angular
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
     exposedHeaders: ['Content-Disposition'],
    credentials: true,
  });
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  //await planningService.handlePlanningReminders();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
