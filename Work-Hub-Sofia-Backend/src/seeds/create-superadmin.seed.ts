import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { User } from 'src/user/entities/user.entity';

dotenv.config();

function ask(question: string, hidden = false): Promise<string> {
  if (!hidden) {
    const terminal = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      terminal.question(question, (answer) => {
        terminal.close();
        resolve(answer.trim());
      });
    });
  }

  return new Promise((resolve, reject) => {
    const input = process.stdin;
    let answer = '';

    process.stdout.write(question);
    input.setRawMode?.(true);
    input.resume();

    const onData = (chunk: Buffer) => {
      const key = chunk.toString();

      if (key === '\u0003') {
        cleanup();
        reject(new Error('Saisie annulée'));
        return;
      }

      if (key === '\r' || key === '\n') {
        process.stdout.write('\n');
        cleanup();
        resolve(answer);
        return;
      }

      if (key === '\u007f' || key === '\b') {
        answer = answer.slice(0, -1);
        return;
      }

      answer += key;
    };

    const cleanup = () => {
      input.removeListener('data', onData);
      input.setRawMode?.(false);
      input.pause();
    };

    input.on('data', onData);
  });
}

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

  const email = await ask('Email du superadmin : ');
  const plainPassword = await ask('Mot de passe du superadmin : ', true);

  if (!email || !plainPassword) {
    throw new Error("L'email et le mot de passe sont obligatoires");
  }

  const superAdmin = new User();
  superAdmin.nom = 'Super';
  superAdmin.prenom = 'Admin';
  superAdmin.email = email;
  superAdmin.numero = 0;
  superAdmin.departementId = null;
  superAdmin.equipeId = null;
  superAdmin.poste = null;


  const saltedPassword = (process.env.PASSWORD_SECRET || '') + plainPassword;
  superAdmin.motDePasse = await bcrypt.hash(saltedPassword, 10);

  superAdmin.role = 'superadmin';

  await userRepository.save(superAdmin);

  console.log('Superadmin créé avec succès.');
  console.log(`Email: ${superAdmin.email}`);
  console.log(`Mot de passe: ${plainPassword}`);
  
  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
});
