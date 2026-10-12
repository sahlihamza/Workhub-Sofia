import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { DemandeConge } from '../demande-conge/entities/demande-conge.entity';
import { Departement } from '../departement/entities/departement.entity';
import { Equipe } from '../equipe/entities/equipe.entity';
import { Planning } from '../planning/entities/planning.entity';
import { Poste } from '../postes/entities/poste.entity';
import { User } from '../user/entities/user.entity';
import {
  campaignFactory,
  demandeCongeFactory,
  departementFactory,
  equipeFactory,
  planningFactory,
  posteFactory,
  userFactory,
} from './factories';

const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'admin 123';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    await dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const departmentRepository = manager.getRepository(Departement);
      const teamRepository = manager.getRepository(Equipe);
      const posteRepository = manager.getRepository(Poste);
      const planningRepository = manager.getRepository(Planning);
      const leaveRepository = manager.getRepository(DemandeConge);
      const campaignRepository = manager.getRepository(Campaign);

      let admin = await userRepository.findOne({
        where: { email: DEFAULT_ADMIN_EMAIL },
      });
      if (!admin) {
        admin = await userRepository.save(
          await userFactory(
            {
              email: DEFAULT_ADMIN_EMAIL,
              nom: 'Admin',
              prenom: 'Super',
              role: 'superadmin',
            },
            DEFAULT_ADMIN_PASSWORD,
          ),
        );
      }

      const departments: Departement[] = [];
      for (const data of [
        ['Ressources humaines', 'Gestion des collaborateurs et des carrières.'],
        ['Technologie', 'Développement et maintenance des produits.'],
      ]) {
        let department = await departmentRepository.findOne({
          where: { nomDepartement: data[0] },
        });
        if (!department) {
          department = await departmentRepository.save(
            departementFactory({
              nomDepartement: data[0],
              descriptionDepartement: data[1],
              responsable: admin,
              responsableId: admin.id,
            }),
          );
        }
        departments.push(department);
      }

      const postes: Poste[] = [];
      for (const [nomPoste, department] of [
        ['Manager', departments[0]],
        ['Développeur', departments[1]],
        ['Designer', departments[1]],
      ] as [string, Departement][]) {
        let poste = await posteRepository.findOne({ where: { nomPoste } });
        if (!poste) {
          poste = await posteRepository.save(
            posteFactory({ nomPoste, departement: department }),
          );
        }
        postes.push(poste);
      }

      const users: User[] = [];
      for (const [index, data] of [
        ['manager@gmail.com', 'Manager', 'RH', 'manager', departments[0], postes[0]],
        ['developpeur@gmail.com', 'Dev', 'Tech', 'collaborateur', departments[1], postes[1]],
        ['designer@gmail.com', 'Design', 'Tech', 'collaborateur', departments[1], postes[2]],
      ].entries()) {
        const [email, nom, prenom, role, department, poste] = data as [
          string,
          string,
          string,
          string,
          Departement,
          Poste,
        ];
        let user = await userRepository.findOne({ where: { email } });
        if (!user) {
          user = await userRepository.save(
            await userFactory(
              {
                email,
                nom,
                prenom,
                role,
                departement: department,
                departementId: department.id,
                poste,
                numero: index + 1,
              },
              'password123',
            ),
          );
        }
        users.push(user);
      }

      const teams: Equipe[] = [];
      for (const [name, department, manager] of [
        ['Équipe RH', departments[0], users[0]],
        ['Équipe Produit', departments[1], users[1]],
      ] as [string, Departement, User][]) {
        let team = await teamRepository.findOne({ where: { nomEquipe: name } });
        if (!team) {
          team = await teamRepository.save(
            equipeFactory({
              nomEquipe: name,
              descriptionEquipe: `Équipe de démonstration ${name}`,
              departement: department,
              responsable: manager,
              nbMembres: 1,
            }),
          );
        }
        teams.push(team);
      }

      if (!users[0].equipeId) {
        users[0].equipe = teams[0];
        users[0].equipeId = teams[0].id;
        await userRepository.save(users[0]);
      }
      if (!users[1].equipeId) {
        users[1].equipe = teams[1];
        users[1].equipeId = teams[1].id;
        await userRepository.save(users[1]);
      }

      const planningDate = new Date().toISOString().slice(0, 10);
      for (const planningUser of [admin, users[1]]) {
        const existingPlanning = await planningRepository.findOne({
          where: { user: { id: planningUser.id }, date: planningDate },
        });
        if (!existingPlanning) {
          await planningRepository.save(
            planningFactory({
              user: planningUser,
              date: planningDate,
              status: 'present',
              notes: 'Donnée de démonstration',
            }),
          );
        }
      }

      const existingLeave = await leaveRepository.findOne({
        where: { user: { id: users[1].id }, cause: 'Congé de démonstration' },
      });
      if (!existingLeave) {
        await leaveRepository.save(
          demandeCongeFactory({
            user: users[1],
            dateDebut: new Date('2026-11-02'),
            dateFin: new Date('2026-11-03'),
            cause: 'Congé de démonstration',
          }),
        );
      }

      const existingCampaign = await campaignRepository.findOne({
        where: { name: 'Campagne de démonstration' },
      });
      if (!existingCampaign) {
        await campaignRepository.save(
          campaignFactory({
            name: 'Campagne de démonstration',
            description: 'Campagne créée par le seed de développement.',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
          }),
        );
      }
    });

    console.log('Seed terminé avec succès.');
    console.log(`Superadmin: ${DEFAULT_ADMIN_EMAIL}`);
    console.log(`Mot de passe: ${DEFAULT_ADMIN_PASSWORD}`);
  } finally {
    await app.close();
  }
}

seed().catch((error) => {
  console.error('Erreur pendant le seed:', error);
  process.exitCode = 1;
});
