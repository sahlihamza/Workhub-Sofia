import * as bcrypt from 'bcrypt';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { DemandeConge } from '../demande-conge/entities/demande-conge.entity';
import { Departement } from '../departement/entities/departement.entity';
import { Equipe } from '../equipe/entities/equipe.entity';
import { Planning } from '../planning/entities/planning.entity';
import { Poste } from '../postes/entities/poste.entity';
import { User } from '../user/entities/user.entity';
import { StatutDemande } from '../demande-conge/entities/StatutDemande.enum';
import { TypeConge } from '../demande-conge/entities/TypeConge.enum';

export async function userFactory(
  data: Partial<User> & Pick<User, 'email' | 'nom' | 'prenom' | 'role'>,
  password = 'password123',
): Promise<User> {
  const user = new User();
  Object.assign(user, data);
  user.motDePasse = await bcrypt.hash(
    `${process.env.PASSWORD_SECRET || ''}${password}`,
    10,
  );
  user.numero ??= 0;
  user.isDeleted ??= false;
  user.soldeConge ??= 25;
  user.soldeCongeMaladie ??= 10;
  user.soldeCompensation ??= 5;
  return user;
}

export function departementFactory(
  data: Partial<Departement> & Pick<Departement, 'nomDepartement'>,
): Departement {
  const departement = new Departement();
  Object.assign(departement, data);
  departement.descriptionDepartement ??= `Département ${departement.nomDepartement}`;
  departement.nbEquipe ??= 0;
  departement.statut ??= true;
  return departement;
}

export function equipeFactory(
  data: Partial<Equipe> & Pick<Equipe, 'nomEquipe' | 'departement'>,
): Equipe {
  const equipe = new Equipe();
  Object.assign(equipe, data);
  equipe.descriptionEquipe ??= `Équipe ${equipe.nomEquipe}`;
  equipe.nbMembres ??= 0;
  return equipe;
}

export function posteFactory(
  data: Partial<Poste> & Pick<Poste, 'nomPoste' | 'departement'>,
): Poste {
  const poste = new Poste();
  Object.assign(poste, data);
  poste.description ??= `Poste ${poste.nomPoste}`;
  return poste;
}

export function planningFactory(
  data: Partial<Planning> & Pick<Planning, 'date' | 'status' | 'user'>,
): Planning {
  const planning = new Planning();
  Object.assign(planning, data);
  return planning;
}

export function demandeCongeFactory(
  data: Partial<DemandeConge> &
    Pick<DemandeConge, 'dateDebut' | 'dateFin' | 'cause' | 'user'>,
): DemandeConge {
  const demande = new DemandeConge();
  Object.assign(demande, data);
  demande.type ??= TypeConge.CONGE;
  demande.statut ??= StatutDemande.EN_ATTENTE;
  demande.duree ??= 1;
  return demande;
}

export function campaignFactory(
  data: Partial<Campaign> & Pick<Campaign, 'name' | 'startDate' | 'endDate'>,
): Campaign {
  const campaign = new Campaign();
  Object.assign(campaign, data);
  return campaign;
}
