import { Departement } from './departement.model';
import { Equipe } from './equipe.model';
import { Poste } from '../services/postes.service';

export class User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  numero?: number;
  role: 'superadmin' | 'admin' | 'manager' | 'collaborateur';

  departementId?: number;
  equipeResponsableId?: number;
  equipeId?: number;

  departement?: Departement;
  equipeResponsable?: Equipe;
  equipe?: Equipe;
  userId: number;
  poste?: Poste | null;

   resetToken?: string | null;
  resetTokenExpiration?: Date | null;
  soldeConge: number;

  soldeCongeMaladie: number;
  soldeCompensation: number;


  constructor(data: Partial<User> = {}) {
    this.nom = data.nom || '';
    this.prenom = data.prenom || '';
    this.email = data.email || '';
    this.numero = data.numero || 0;
    this.role = data.role || 'collaborateur';
    this.departementId = data.departementId;
    this.equipeResponsableId = data.equipeResponsableId;
    this.equipeId = data.equipeId;

    this.departement = data.departement ? new Departement(data.departement) : undefined;
    this.equipeResponsable = data.equipeResponsable ? new Equipe(data.equipeResponsable) : undefined;
    this.equipe = data.equipe ? new Equipe(data.equipe) : undefined;
     this.soldeConge = data.soldeConge ?? 0;
    this.soldeCongeMaladie = data.soldeCongeMaladie ?? 0;
    this.soldeCompensation = data.soldeCompensation ?? 0;
  }
}
