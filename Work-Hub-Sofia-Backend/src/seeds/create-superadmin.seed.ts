import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from 'src/user/entities/user.entity';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);

  const existingAdmin = await userRepository.findOne({ where: { role: 'superadmin' } });
  if (existingAdmin) {
    console.log('Superadmin déjà existant');
    await app.close();
    return;
  }

  const superAdmin = new User();
  superAdmin.nom = 'Super';
  superAdmin.prenom = 'Admin';
  superAdmin.email = process.env.SUPERADMIN_EMAIL!;
  superAdmin.departementId = null;
superAdmin.equipeId = null;


  const plainPassword = process.env.SUPERADMIN_PASSWORD!;
  const saltedPassword = (process.env.PASSWORD_SECRET || '') + plainPassword;
  superAdmin.motDePasse = await bcrypt.hash(saltedPassword, 10);

  superAdmin.role = 'superadmin';

  await userRepository.save(superAdmin);

  console.log(`Superadmin créé avec l'email: ${superAdmin.email} et mot de passe: ${plainPassword}`);
  
  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
});
