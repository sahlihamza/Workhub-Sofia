import { StatutDemande } from "../enum/statut-demande.enum";
import { TypeConge } from "../enum/type-conge.enum";
import { User } from "./user.model";

export class DemandeConge {
  id?: number;
  dateDebut: string;   // date au format ISO string (ex: '2025-08-07')
  dateFin: string;
  cause: string;
  type: TypeConge;
  duree: number;
  statut: StatutDemande;
  userId?: number;  // référence à l'utilisateur (par ex. son id)
  utilisateur?: User;
  demiJourDebut?: boolean; 
  demiJourFin?: boolean;  
}
