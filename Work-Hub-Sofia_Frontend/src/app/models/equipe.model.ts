import { Departement } from './departement.model';
import { User } from './user.model';

export class Equipe {
  id?: number;
  nomEquipe: string;
  descriptionEquipe: string;
  nbMembres?: number;
  departement?: Departement;
  responsableEquipe?: User;
  membres?: User[];

  constructor(data: Partial<Equipe> = {}) {
    this.id = data.id;
    this.nomEquipe = data.nomEquipe || '';
    this.descriptionEquipe = data.descriptionEquipe || '';
    this.nbMembres = data.nbMembres || 0;

    this.departement = data.departement ? new Departement(data.departement) : undefined;
    this.responsableEquipe = data.responsableEquipe ? new User(data.responsableEquipe) : undefined;
    this.membres = data.membres ? data.membres.map(m => new User(m)) : [];
  }
}
