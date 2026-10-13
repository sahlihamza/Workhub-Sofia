import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { User } from '../user/entities/user.entity';

const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'admin 123';

async function resetSuperadminPassword() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get(DataSource);
    const userRepository = dataSource.getRepository(User);
    const admin = await userRepository.findOne({
      where: { email: DEFAULT_ADMIN_EMAIL },
    });

    if (!admin) {
      throw new Error(`Utilisateur introuvable: ${DEFAULT_ADMIN_EMAIL}`);
    }

    const passwordSecret = process.env.PASSWORD_SECRET || '';
    admin.motDePasse = await bcrypt.hash(
      `${passwordSecret}${DEFAULT_ADMIN_PASSWORD}`,
      10,
    );
    admin.role = 'superadmin';
    await userRepository.save(admin);

    console.log('Mot de passe du superadmin réinitialisé avec succès.');
    console.log(`Email: ${DEFAULT_ADMIN_EMAIL}`);
    console.log(`Mot de passe: ${DEFAULT_ADMIN_PASSWORD}`);
  } finally {
    await app.close();
  }
}

resetSuperadminPassword().catch((error) => {
  console.error('Erreur pendant la réinitialisation du mot de passe:', error);
  process.exitCode = 1;
});
