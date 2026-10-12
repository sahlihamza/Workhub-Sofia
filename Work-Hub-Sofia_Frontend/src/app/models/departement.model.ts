import { User } from './user.model';
import { Equipe } from './equipe.model';

export class Departement {
  id?: number;
  nomDepartement: string;
  descriptionDepartement: string;
  nbEquipe?: number;
  statut?: boolean;

  responsable?: User;
  equipes?: Equipe[];
  users?: User[];

  constructor(data: Partial<Departement> = {}) {
    this.id = data.id;
    this.nomDepartement = data.nomDepartement || '';
    this.descriptionDepartement = data.descriptionDepartement || '';
    this.nbEquipe = data.nbEquipe || 0;
    this.statut = data.statut ?? true;

    this.responsable = data.responsable ? new User(data.responsable) : undefined;
    this.equipes = data.equipes ? data.equipes.map(e => new Equipe(e)) : [];
    this.users = data.users ? data.users.map(u => new User(u)) : [];
  }
}
