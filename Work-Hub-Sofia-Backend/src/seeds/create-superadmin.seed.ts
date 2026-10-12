import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from 'src/user/entities/user.entity';

dotenv.config();

const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'admin 123';

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
  superAdmin.email = DEFAULT_ADMIN_EMAIL;
  superAdmin.numero = 0;
  superAdmin.departementId = null;
  superAdmin.equipeId = null;
  superAdmin.poste = null;


  const saltedPassword =
    (process.env.PASSWORD_SECRET || '') + DEFAULT_ADMIN_PASSWORD;
  superAdmin.motDePasse = await bcrypt.hash(saltedPassword, 10);

  superAdmin.role = 'superadmin';

  await userRepository.save(superAdmin);

  console.log('Superadmin créé avec succès.');
  console.log(`Email: ${DEFAULT_ADMIN_EMAIL}`);
  console.log(`Mot de passe: ${DEFAULT_ADMIN_PASSWORD}`);
  
  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
});
