import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDemandeCongeDto } from './dto/create-demande-conge.dto';
import { UpdateDemandeCongeDto } from './dto/update-demande-conge.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemandeConge } from './entities/demande-conge.entity';
import { User } from 'src/user/entities/user.entity';
import * as dayjs from 'dayjs';
import { StatutDemande } from './entities/StatutDemande.enum';
import { MailService } from 'src/mail/mail.service';
import { TypeConge } from './entities/TypeConge.enum';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DemandeCongeService {
  constructor(
    @InjectRepository(DemandeConge)
    private demandeCongeRepository: Repository<DemandeConge>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  private async getJoursFeries(annee: number): Promise<any[]> {
    const apiKey = process.env.CALENDARIFIC_API_KEY;
    if (!apiKey) throw new Error("La clé API Calendarific n'est pas définie.");

    const response = await fetch(
      `https://calendarific.com/api/v2/holidays?&api_key=${apiKey}&country=TN&year=${annee}`
    );
    const data = await response.json();
    return data.response?.holidays || [];
  }

  // --- Calcul de la durée en jours ouvrés + demi-journées + jours fériés ---
  private async calculerDureeAvecDemiJours(
  dateDebut: dayjs.Dayjs,
  dateFin: dayjs.Dayjs,
  demiJourDebut: boolean,
  demiJourFin: boolean,
): Promise<number> {
  // Importer et étendre localement dayjs
  const dayjsLocal = require('dayjs');
  const isBetween = require('dayjs/plugin/isBetween');
  dayjsLocal.extend(isBetween);

  const diffJours = dateFin.diff(dateDebut, 'day');
  if (diffJours < 0) return 0;

  // Compter les jours ouvrés (lundi à vendredi)
  let joursOuvres = 0;
  for (let i = 0; i <= diffJours; i++) {
    const jour = dateDebut.add(i, 'day');
    if (jour.day() !== 0 && jour.day() !== 6) { // ignore dimanche(0) et samedi(6)
      joursOuvres++;
    }
  }

  // Récupérer les jours fériés
  const joursFeries = await this.getJoursFeries(dateDebut.year());
  joursFeries.forEach(jourFerie => {
    const dateFerie = dayjsLocal(jourFerie.date.iso);
    if (
      dateFerie.isBetween(dateDebut, dateFin, 'day', '[]') &&
      dateFerie.day() !== 0 && dateFerie.day() !== 6
    ) {
      joursOuvres--;
    }
  });

  // Ajustement demi-journées aux extrémités
  if (demiJourDebut) joursOuvres -= 0.5;
  if (demiJourFin) joursOuvres -= 0.5;

  return joursOuvres;
}


  // --- Création de la demande ---
  async create(createDemandeCongeDto: CreateDemandeCongeDto, userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé.');

    const dateDebut = dayjs(createDemandeCongeDto.dateDebut);
    const dateFin = dayjs(createDemandeCongeDto.dateFin);

    if (dateFin.isBefore(dateDebut)) {
      throw new BadRequestException('La date de fin doit être après la date de début.');
    }

    // Calcul de la durée en jours ouvrés et jours fériés exclus
    const duree = await this.calculerDureeAvecDemiJours(
      dateDebut,
      dateFin,
      createDemandeCongeDto.demiJourDebut,
      createDemandeCongeDto.demiJourFin,
    );

    // Récupérer le solde selon le type de congé sélectionné
    let soldeDisponible: number;
    switch(createDemandeCongeDto.type) {
      case 'conge':
        soldeDisponible = Number(user.soldeConge);
        break;
      case 'conge_maladie':
        soldeDisponible = Number(user.soldeCongeMaladie);
        break;
      case 'compensation':
        soldeDisponible = Number(user.soldeCompensation);
        break;
      default:
        throw new BadRequestException('Type de congé invalide.');
    }

    if (soldeDisponible < duree) {
      throw new BadRequestException(
        `Solde insuffisant pour le type de congé sélectionné. Il vous reste ${soldeDisponible} jour(s).`
      );
    }

    // Créer la demande avec la durée calculée
    const demande = this.demandeCongeRepository.create({
      ...createDemandeCongeDto,
      duree: parseFloat(duree.toFixed(2)),
      user,
    });

    await this.demandeCongeRepository.save(demande);

    try {
      await this.mailService.sendNotificationNouvelleDemande(demande);
      console.log(`Notification email envoyée au responsable de la demande ID ${demande.id}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification email:", error);
    }

    return { message: 'Votre demande est envoyée avec succès.' };
  }




  // async create(createDemandeCongeDto: CreateDemandeCongeDto, userId: number) {
  //   const user = await this.userRepository.findOne({ where: { id: userId } });

  //   if (!user) {
  //     throw new NotFoundException('Utilisateur non trouvé.');
  //   }

  //   const dateDebut = dayjs(createDemandeCongeDto.dateDebut);
  //   const dateFin = dayjs(createDemandeCongeDto.dateFin);

  //   if (dateFin.isBefore(dateDebut)) {
  //     throw new BadRequestException(
  //       'La date de fin doit être après la date de début.',
  //     );
  //   }

  //   const duree = dateFin.diff(dateDebut, 'day') + 1;

  //   if (user.soldeConge < duree) {
  //     throw new BadRequestException(
  //       `Solde insuffisant. Il vous reste ${user.soldeConge} jour(s).`,
  //     );
  //   }

  //   const demande = this.demandeCongeRepository.create({
  //     ...createDemandeCongeDto,
  //     duree,
  //     user,
  //   });

  //   await this.demandeCongeRepository.save(demande);

  //   try {
  //   await this.mailService.sendNotificationNouvelleDemande(demande);
  //   console.log(`Notification email envoyée au responsable de la demande ID ${demande.id}`);
  // } catch (error) {
  //   console.error("Erreur lors de l'envoi de la notification email:", error);
  // }

  //   return { message: 'Votre demande est envoyée avec succès.' };
  // }

  async findAllDemande(userConnecte: any): Promise<DemandeConge[]> {
    const query = this.demandeCongeRepository
      .createQueryBuilder('demande')
      .leftJoinAndSelect('demande.user', 'user')
      .leftJoinAndSelect('user.departement', 'departement')
      .leftJoinAndSelect('user.equipe', 'equipe');

    switch (userConnecte.role) {
      case 'superadmin':
        query.where('user.role != :role', { role: 'superadmin' });
        break;

      case 'admin':
        if (!userConnecte.departementId) {
          throw new BadRequestException(
            "L'utilisateur admin doit avoir un département défini.",
          );
        }
        query
          .where('user.role = :role', { role: 'manager' })
          .andWhere('user.departement.id = :departementId', {
            departementId: userConnecte.departementId,
          });
        break;

      case 'manager':
        if (!userConnecte.equipeId) {
          throw new BadRequestException(
            'Le manager doit avoir une équipe définie.',
          );
        }
        query
          .where('user.role = :role', { role: 'collaborateur' })
          .andWhere('user.equipe.id = :equipeId', {
            equipeId: userConnecte.equipeId,
          });
        break;

      default:
        return [];
    }

    const demandes = await query.getMany();

    if (demandes.length === 0) {
      throw new NotFoundException('Aucune demande pour le moment.');
    }

    return demandes;
  }

//   async traiterDemande(
//   id: number,
//   statut: 'confirmee' | 'rejettee',
//   userConnecte: any,
// ) {
//   const demande = await this.demandeCongeRepository.findOne({
//     where: { id },
//     relations: ['user'],
//   });

//   if (!demande) {
//     throw new NotFoundException('Demande non trouvée.');
//   }

//   if (demande.statut !== StatutDemande.EN_ATTENTE) {
//     throw new BadRequestException('Cette demande a déjà été traitée.');
//   }

//   const user = await this.userRepository.findOne({
//     where: { id: demande.user.id },
//   });

//   if (!user) {
//     throw new NotFoundException('Utilisateur lié à cette demande non trouvé.');
//   }

//   if (statut === StatutDemande.CONFIRMEE) {
//     const soldeRestant = user.soldeConge - demande.duree;
//     if (soldeRestant < 0) {
//       throw new BadRequestException(
//         'Impossible de confirmer la demande. Solde insuffisant.',
//       );
//     }

//     user.soldeConge = soldeRestant;
//     await this.userRepository.save(user);

//     demande.statut = StatutDemande.CONFIRMEE;
// const dateDemandeFormatee = demande.createdAt.toLocaleDateString('fr-FR');
// const dateDebutFormatee = dayjs(demande.dateDebut).format('DD/MM/YYYY');
// const dateFinFormatee = dayjs(demande.dateFin).format('DD/MM/YYYY');
// await this.mailService.sendDemandeConfirmeeEmail(user.email, user.nom, dateDemandeFormatee, dateDebutFormatee, dateFinFormatee);
// ; // ✅ Mail confirmation
//   } else if (statut === StatutDemande.REJETEE) {
//     demande.statut = StatutDemande.REJETEE;
// const dateDemandeFormatee = dayjs(demande.createdAt).format('DD/MM/YYYY');
// const dateDebutFormatee = dayjs(demande.dateDebut).format('DD/MM/YYYY');
// const dateFinFormatee = dayjs(demande.dateFin).format('DD/MM/YYYY');
// await this.mailService.sendDemandeRejeteeEmail(user.email, user.nom, dateDemandeFormatee, dateDebutFormatee, dateFinFormatee);
//   } else {
//     throw new BadRequestException('Statut invalide.');
//   }

//   await this.demandeCongeRepository.save(demande);

//   return {
//     message: `La demande a été ${statut === 'confirmee' ? 'confirmée' : 'rejetée'}.`,
//   };
// }

async traiterDemande(
  id: number,
  statut: 'confirmee' | 'rejettee',
  userConnecte: any,
) {
  const demande = await this.demandeCongeRepository.findOne({
    where: { id },
    relations: ['user'],
  });

  if (!demande) throw new NotFoundException('Demande non trouvée.');
  if (demande.statut !== StatutDemande.EN_ATTENTE) {
    throw new BadRequestException('Cette demande a déjà été traitée.');
  }

  const user = await this.userRepository.findOne({ where: { id: demande.user.id } });
  if (!user) throw new NotFoundException('Utilisateur lié à cette demande non trouvé.');

  const duree = Number(demande.duree);

  // Choix du solde selon le type de congé
  let soldeActuel: number;
  let setterSolde: (val: number) => void;

  switch (demande.type) {
    case TypeConge.CONGE:
      soldeActuel = Number(user.soldeConge);
      setterSolde = (val) => { user.soldeConge = val; };
      break;
    case TypeConge.CONGE_MALADIE:
      soldeActuel = Number(user.soldeCongeMaladie);
      setterSolde = (val) => { user.soldeCongeMaladie = val; };
      break;
    case TypeConge.COMPENSATION:
      soldeActuel = Number(user.soldeCompensation);
      setterSolde = (val) => { user.soldeCompensation = val; };
      break;
    default:
      throw new BadRequestException("Type de congé inconnu.");
  }

  // Formatage des dates pour le mail
  const dateDemandeFormatee = dayjs(demande.createdAt).format('DD/MM/YYYY');
  const dateDebutFormatee = dayjs(demande.dateDebut).format('DD/MM/YYYY');
  const dateFinFormatee = dayjs(demande.dateFin).format('DD/MM/YYYY');

  if (statut === StatutDemande.CONFIRMEE) {
    const soldeRestant = soldeActuel - duree;
    if (soldeRestant < 0) {
      throw new BadRequestException('Solde insuffisant pour ce type de congé.');
    }
    setterSolde(parseFloat(soldeRestant.toFixed(2)));
    await this.userRepository.save(user);

    demande.statut = StatutDemande.CONFIRMEE;

    // Envoi du mail de confirmation
    await this.mailService.sendDemandeConfirmeeEmail(
      user.email,
      user.nom,
      dateDemandeFormatee,
      dateDebutFormatee,
      dateFinFormatee,
    );

  } else if (statut === StatutDemande.REJETEE) {
    demande.statut = StatutDemande.REJETEE;

    // Envoi du mail de rejet
    await this.mailService.sendDemandeRejeteeEmail(
      user.email,
      user.nom,
      dateDemandeFormatee,
      dateDebutFormatee,
      dateFinFormatee,
    );

  } else {
    throw new BadRequestException('Statut invalide.');
  }

  await this.demandeCongeRepository.save(demande);

  return {
    message: `La demande a été ${statut === 'confirmee' ? 'confirmée' : 'rejetée'}.`,
  };
}
//methodes pour augmanter le solde de congé et congé maladie

// --- Augmenter le solde de congé mensuel pour tous les utilisateurs ---
  // async augmenterSoldeCongeMensuel() {
  //   const users = await this.userRepository.find();
  //   for (const user of users) {
  //     user.soldeConge = Number(user.soldeConge) + 1.83;
  //     await this.userRepository.save(user);
  //   }
  // }

  // --- Augmenter le solde de congé maladie annuel pour tous les utilisateurs ---
  async augmenterSoldeCongeMaladieAnnuel() {
    const users = await this.userRepository.find();
    for (const user of users) {
      user.soldeCongeMaladie = Number(user.soldeCongeMaladie) + 5;
      await this.userRepository.save(user);
    }
  }

  // --- Remettre le solde annuel à zéro et augmenter mensuellement ---
  async resetEtAugmenterSoldeCongeMensuel() {
    const users = await this.userRepository.find();

    for (const user of users) {
      const today = new Date();
      const debutAnnee = new Date(today.getFullYear(), 0, 1); // 1er janvier

      // Si c'est le 1er janvier, reset du solde
      if (today.toDateString() === debutAnnee.toDateString()) {
        user.soldeConge = 0;
      }

      // Ajouter 1,83 jour pour le mois courant
      user.soldeConge = Number(user.soldeConge) + 1.83;

      await this.userRepository.save(user);
    }
  }

  // --- Cron automatique ---
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async cronAugmenterCongeMensuel() {
    await this.resetEtAugmenterSoldeCongeMensuel();
  }

  @Cron(CronExpression.EVERY_YEAR)
  async cronAugmenterCongeMaladieAnnuel() {
    await this.augmenterSoldeCongeMaladieAnnuel();
  }


  


  findOne(id: number) {
    return `This action returns a #${id} demandeConge`;
  }

  update(id: number, updateDemandeCongeDto: UpdateDemandeCongeDto) {
    return `This action updates a #${id} demandeConge`;
  }

  remove(id: number) {
    return `This action removes a #${id} demandeConge`;
  }
}
