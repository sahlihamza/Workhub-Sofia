import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException, Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { Departement } from '../departement/entities/departement.entity';
import { Equipe } from '../equipe/entities/equipe.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MoreThanOrEqual } from 'typeorm';
import { Planning } from '../planning/entities/planning.entity';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Departement)
    private departementRepository: Repository<Departement>,
    private dataSource: DataSource,
    @InjectRepository(Equipe)
    private equipeRepository: Repository<Equipe>,
    private mailService: MailService

  ) {}

//   private generateRandomPassword(length = 10): string {
//     const chars =
//       'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//     let password = '';
//     for (let i = 0; i < length; i++) {
//       password += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     return password;
//   }




// async create(createUserDto: CreateUserDto, creator: any): Promise<{ nom: string; prenom: string; email: string }> {
//   // Vérification existence email
//   const existingUser = await this.userRepository.findOne({
//     where: { email: createUserDto.email },
//   });

//   if (existingUser) {
//     throw new ConflictException(
//       'Cet email est déjà utilisé par un autre utilisateur.',
//     );
//   }

//   const user = new User();
//   user.nom = createUserDto.nom;
//   user.prenom = createUserDto.prenom;
//   user.email = createUserDto.email;

//   // Génération du mot de passe en clair
//   const generatedPassword = this.generateRandomPassword();

//   // Hashage du mot de passe avant stockage
//   const saltRounds = 10;
//   user.motDePasse = await bcrypt.hash(generatedPassword, saltRounds);

//   user.numero = createUserDto.numero;

//   // Gestion du rôle selon le créateur
//   if (creator.role === 'admin'|| creator.role === 'superadmin') {
//     user.role = 'collaborateur';
//   } else {
//     user.role = createUserDto.role;
//   }

//   // Affectations selon rôle du créateur
//   switch (creator.role) {
//     case 'superadmin':
//       if (!createUserDto.departementId) {
//         throw new BadRequestException('Le département est requis.');
//       }
//       user.departement = { id: createUserDto.departementId } as any;

//       if (user.role === 'manager' && createUserDto.equipeResponsableId) {
//         user.equipeResponsable = { id: createUserDto.equipeResponsableId } as any;
//       }

//       if (user.role === 'collaborateur' && createUserDto.equipeId) {
//         user.equipe = { id: createUserDto.equipeId } as any;
//       }
//       break;

//     case 'admin':
//       if (!creator.departementId) {
//         throw new ForbiddenException(
//           'Votre profil est incomplet (département manquant).',
//         );
//       }
//       if (user.role === 'admin' || user.role === 'superadmin') {
//         throw new ForbiddenException('Vous ne pouvez pas créer ce type de rôle.');
//       }
//       user.departement = { id: creator.departementId } as any;

//       if (user.role === 'manager' && createUserDto.equipeResponsableId) {
//         user.equipeResponsable = {
//           id: createUserDto.equipeResponsableId,
//         } as any;
//       }

//       if (user.role === 'collaborateur' && createUserDto.equipeId) {
//         user.equipe = { id: createUserDto.equipeId } as any;
//       }
//       break;

//     case 'manager':
//       if (!creator.departementId || !creator.equipeId) {
//         throw new ForbiddenException(
//           'Votre profil est incomplet (département ou équipe manquant).',
//         );
//       }
//       if (user.role !== 'collaborateur') {
//         throw new ForbiddenException(
//           'Un manager ne peut créer que des collaborateurs.',
//         );
//       }
//       user.departement = { id: creator.departementId } as any;
//       user.equipe = { id: creator.equipeId } as any;
//       break;

//     default:
//       throw new ForbiddenException('Rôle non autorisé.');
//   }

//   // Sauvegarde en base
//   const savedUser = await this.userRepository.save(user);

//   // Envoi email avec mot de passe en clair
//   try {
//     await this.mailService.sendPasswordCreatedEmail(savedUser.email, generatedPassword);
//   } catch (error) {
//     console.error('Erreur lors de l’envoi de l’email de mot de passe:', error);
//     // Ici, tu peux gérer l’erreur (rollback, log, etc.)
//   }

//   // Retourne les champs souhaités
//   return {
//     nom: savedUser.nom,
//     prenom: savedUser.prenom,
//     email: savedUser.email,
//   };
// }

//methode create avec le secret pour le mot de passe
private readonly PASSWORD_SECRET = process.env.PASSWORD_SECRET || '';

private generateRandomPassword(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

  private toSafeUser(user: User): any {
    const {
      motDePasse,
      numero,
      resetToken,
      resetTokenExpiration,
      ...safeUser
    } = user;
    return safeUser;
  }




async create(createUserDto: CreateUserDto, creator: any): Promise<{ nom: string; prenom: string; email: string }> {
  // Vérification existence email
  const existingUser = await this.userRepository.findOne({
    where: { email: createUserDto.email },
  });

  if (existingUser) {
    throw new ConflictException('Cet email est déjà utilisé par un autre utilisateur.');
  }

  const user = new User();
  user.nom = createUserDto.nom;
  user.prenom = createUserDto.prenom;
  user.email = createUserDto.email;

  // Génération du mot de passe en clair
  const generatedPassword = this.generateRandomPassword();

  // Ajout du secret avant hachage
  const saltedPassword = this.PASSWORD_SECRET + generatedPassword;
  const saltRounds = 10;
  user.motDePasse = await bcrypt.hash(saltedPassword, saltRounds);

  user.numero = createUserDto.numero;

  // Gestion du rôle selon le créateur
  if (creator.role === 'admin' || creator.role === 'superadmin') {
    user.role = 'collaborateur';
  } else {
    user.role = createUserDto.role;
  }

  // Affectations selon rôle du créateur
  switch (creator.role) {
    case 'superadmin':
      if (!createUserDto.departementId) {
        throw new BadRequestException('Le département est requis.');
      }
      user.departement = { id: createUserDto.departementId } as any;

      if (user.role === 'manager' && createUserDto.equipeResponsableId) {
        user.equipeResponsable = { id: createUserDto.equipeResponsableId } as any;
      }

      if (user.role === 'collaborateur' && createUserDto.equipeId) {
        user.equipe = { id: createUserDto.equipeId } as any;
      }
      break;

    case 'admin':
      if (!creator.departementId) {
        throw new ForbiddenException('Votre profil est incomplet (département manquant).');
      }
      if (user.role === 'admin' || user.role === 'superadmin') {
        throw new ForbiddenException('Vous ne pouvez pas créer ce type de rôle.');
      }
      user.departement = { id: creator.departementId } as any;

      if (user.role === 'manager' && createUserDto.equipeResponsableId) {
        user.equipeResponsable = { id: createUserDto.equipeResponsableId } as any;
      }

      if (user.role === 'collaborateur' && createUserDto.equipeId) {
        user.equipe = { id: createUserDto.equipeId } as any;
      }
      break;

    case 'manager':
      if (!creator.departementId || !creator.equipeId) {
        throw new ForbiddenException('Votre profil est incomplet (département ou équipe manquant).');
      }
      if (user.role !== 'collaborateur') {
        throw new ForbiddenException('Un manager ne peut créer que des collaborateurs.');
      }
      user.departement = { id: creator.departementId } as any;
      user.equipe = { id: creator.equipeId } as any;
      break;

    default:
      throw new ForbiddenException('Rôle non autorisé.');
  }

  // Sauvegarde en base
  const savedUser = await this.userRepository.save(user);

  // Envoi email avec mot de passe en clair
  try {
    await this.mailService.sendPasswordCreatedEmail(savedUser.email, generatedPassword);
  } catch (error) {
    console.error('Erreur lors de l’envoi de l’email de mot de passe:', error);
  }

  // Retour
  return {
    nom: savedUser.nom,
    prenom: savedUser.prenom,
    email: savedUser.email,
  };
}


//les methodes de find j'ai ajouer and where pour tous les conditions pour ne pas afficher les utilisateurs supprimés
  async findAll(user: any): Promise<Partial<User>[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.departement', 'departement')
      .leftJoinAndSelect('user.equipe', 'equipe')
      .leftJoinAndSelect('user.poste', 'poste')
      .andWhere('user.isDeleted = false'); // 🔹 on filtre ici


    switch (user.role) {
      case 'superadmin':
        query.andWhere('user.id != :userId', { userId: user.userId });
        break;

      case 'admin':
        if (!user.departementId) {
          return [];
        }
        query
          .andWhere('user.departementId = :departementId', {
            departementId: user.departementId,
          })
          .andWhere('user.id != :userId', { userId: user.userId });
        break;

      case 'manager':
        if (!user.equipeId || !user.departementId) {
          return [];
        }
        query
          .andWhere('user.equipeId = :equipeId', { equipeId: user.equipeId })
          .andWhere('user.departementId = :departementId', {
            departementId: user.departementId,
          })
          .andWhere('user.id != :userId', { userId: user.userId });
        break;

      case 'collaborateur':
        if (!user.equipeId || !user.departementId) {
          return [];
        }
        query
          .andWhere('user.equipeId = :equipeId', { equipeId: user.equipeId })
          .andWhere('user.departementId = :departementId', {
            departementId: user.departementId,
          })
          .andWhere('user.id != :userId', { userId: user.userId })
          .andWhere('user.role = :role', { role: 'collaborateur' });
        break;

      default:
        throw new ForbiddenException('Rôle non autorisé.');
    }

    const users = await query.getMany();
    return users.map(user => this.toSafeUser(user));
  }

  async findUsersByRole(roles: string[]): Promise<User[]> {
    if (!roles || roles.length === 0) {
      throw new BadRequestException('At least one role must be provided.');
    }
    const users = await this.userRepository.find({
      where: {
        role: In(roles),
      },
      relations: ['equipe', 'poste'],
    });
    return users.map(user => this.toSafeUser(user));
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.toSafeUser(user);
  }
  async findAvailableMembers(): Promise<User[]> {
    const users = await this.userRepository.find({
      where: {
        role: In(['collaborateur', 'manager']),
        departementId: IsNull(),
      },
    });
    return users.map(user => this.toSafeUser(user));
  }

  async findCollaboratorsForPositioning(requestingUser: any): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.role = :role', { role: 'collaborateur' });

    if ((requestingUser.role === 'admin' || requestingUser.role === 'manager') && requestingUser.departementId) {
      query.andWhere('user.departementId = :departementId', {
        departementId: requestingUser.departementId,
      });
    }
    const users = await query.getMany();
    return users.map(user => this.toSafeUser(user));
  }

  async update(
    id: number,
    updateUserDto: CreateUserDto,
    editor: any,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['equipe'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    if (user.role === 'superadmin' && editor.role !== 'superadmin') {
      throw new ForbiddenException('Vous ne pouvez pas modifier un superadmin.');
    }

    switch (editor.role) {
      case 'superadmin':
        if (updateUserDto.departementId) {
          user.departement = { id: updateUserDto.departementId } as any;
        }

        if (
          updateUserDto.role === 'manager' &&
          updateUserDto.equipeResponsableId
        ) {
          user.equipeResponsable = {
            id: updateUserDto.equipeResponsableId,
          } as any;
        }

        if (updateUserDto.role === 'collaborateur' && updateUserDto.equipeId) {
          user.equipe = { id: updateUserDto.equipeId } as any;
        }
        break;

      case 'admin':
        if (!editor.departementId) {
          throw new ForbiddenException(
            'Votre profil est incomplet (département manquant).',
          );
        }

        if (['admin', 'superadmin'].includes(user.role)) {
          throw new ForbiddenException(
            'Vous ne pouvez pas modifier un admin ou superadmin.',
          );
        }

        user.departement = { id: editor.departementId } as any;

        if (
          updateUserDto.role === 'manager' &&
          updateUserDto.equipeResponsableId
        ) {
          user.equipeResponsable = {
            id: updateUserDto.equipeResponsableId,
          } as any;
        }

        if (updateUserDto.role === 'collaborateur' && updateUserDto.equipeId) {
          user.equipe = { id: updateUserDto.equipeId } as any;
        }
        break;

      case 'manager':
        if (!editor.departementId || !editor.equipeId) {
          throw new ForbiddenException(
            'Votre profil est incomplet (département ou équipe manquant).',
          );
        }

        if (user.role !== 'collaborateur') {
          throw new ForbiddenException(
            'Un manager ne peut modifier que des collaborateurs.',
          );
        }

        if (user.equipe?.id !== editor.equipeId) {
          throw new ForbiddenException(
            'Vous ne pouvez modifier que les collaborateurs de votre équipe.',
          );
        }

        user.departement = { id: editor.departementId } as any;
        user.equipe = { id: editor.equipeId } as any;
        break;

      default:
        throw new ForbiddenException('Rôle non autorisé.');
    }

    user.nom = updateUserDto.nom;
    user.prenom = updateUserDto.prenom;
    user.email = updateUserDto.email;
    user.numero = updateUserDto.numero;
    // user.role = updateUserDto.role;

    return this.userRepository.save(user);
  }

//   async remove(id: number, deleter: any): Promise<{ message: string }> {
//   const userToDelete = await this.userRepository.findOne({
//     where: { id, isDeleted: false }, // On ne récupère que les utilisateurs non supprimés
//     relations: ['departement', 'equipe'],
//   });

//   if (!userToDelete) {
//     throw new NotFoundException('Utilisateur à supprimer introuvable.');
//   }

//   if (userToDelete.role === 'superadmin' && deleter.role !== 'superadmin') {
//     throw new ForbiddenException('Vous ne pouvez pas supprimer un superadmin.');
//   }

//   switch (deleter.role) {
//     case 'superadmin':
//       // superadmin peut supprimer tout (sauf autre superadmin sauf lui-même)
//       break;

//     case 'admin':
//       if (!deleter.departementId) {
//         throw new ForbiddenException(
//           'Votre profil est incomplet (département manquant).',
//         );
//       }
//       if (['admin', 'superadmin'].includes(userToDelete.role)) {
//         throw new ForbiddenException(
//           'Vous ne pouvez pas supprimer un admin ou superadmin.',
//         );
//       }
//       if (userToDelete.departement?.id !== deleter.departementId) {
//         throw new ForbiddenException(
//           'Vous ne pouvez supprimer que les employés de votre département.',
//         );
//       }
//       break;

//     case 'manager':
//       if (!deleter.departementId || !deleter.equipeId) {
//         throw new ForbiddenException(
//           'Votre profil est incomplet (département ou équipe manquant).',
//         );
//       }
//       if (userToDelete.role !== 'collaborateur') {
//         throw new ForbiddenException(
//           'Un manager ne peut supprimer que des collaborateurs.',
//         );
//       }
//       if (userToDelete.equipe?.id !== deleter.equipeId) {
//         throw new ForbiddenException(
//           'Vous ne pouvez supprimer que les collaborateurs de votre équipe.',
//         );
//       }
//       break;

//     default:
//       throw new ForbiddenException('Rôle non autorisé.');
//   }

//   try {
//     // Suppression logique : on marque isDeleted à true
//     await this.userRepository.update(id, { isDeleted: true });
//     return { message: "L'utilisateur a été désactivé avec succès." };
//   } catch (error) {
//     throw new InternalServerErrorException('Erreur lors de la désactivation.');
//   }
// }
async remove(id: number, deleter: any): Promise<{ message: string }> {
  const userToDelete = await this.userRepository.findOne({
    where: { id, isDeleted: false },
    relations: ['departement', 'equipe', 'equipeResponsable'],
  });

  if (!userToDelete) {
    throw new NotFoundException("Utilisateur à supprimer introuvable.");
  }

  // Vérification des rôles
  if (userToDelete.role === 'superadmin' && deleter.role !== 'superadmin') {
    throw new ForbiddenException("Vous ne pouvez pas supprimer un superadmin.");
  }

  switch (deleter.role) {
    case 'superadmin':
      // superadmin peut supprimer tout (sauf autre superadmin sauf lui-même)
      break;

    case 'admin':
      if (!deleter.departementId) {
        throw new ForbiddenException(
          "Votre profil est incomplet (département manquant)."
        );
      }
      if (['admin', 'superadmin'].includes(userToDelete.role)) {
        throw new ForbiddenException(
          "Vous ne pouvez pas supprimer un admin ou superadmin."
        );
      }
      if (userToDelete.departement?.id !== deleter.departementId) {
        throw new ForbiddenException(
          "Vous ne pouvez supprimer que les employés de votre département."
        );
      }
      break;

    case 'manager':
      if (!deleter.departementId || !deleter.equipeId) {
        throw new ForbiddenException(
          "Votre profil est incomplet (département ou équipe manquant)."
        );
      }
      if (userToDelete.role !== 'collaborateur') {
        throw new ForbiddenException(
          "Un manager ne peut supprimer que des collaborateurs."
        );
      }
      if (userToDelete.equipe?.id !== deleter.equipeId) {
        throw new ForbiddenException(
          "Vous ne pouvez supprimer que les collaborateurs de votre équipe."
        );
      }
      break;

    default:
      throw new ForbiddenException("Rôle non autorisé.");
  }

  try {
    // Si l'utilisateur est responsable d'un département, on retire sa responsabilité
    const departementsResponsables = await this.departementRepository.find({
      where: { responsableId: userToDelete.id },
    });

    for (const dep of departementsResponsables) {
      dep.responsableId = null;
      dep.responsable = null;
      await this.departementRepository.save(dep);
    }

    // Si l'utilisateur est responsable d'une équipe, on retire sa responsabilité
    const equipesResponsables = await this.equipeRepository.find({
      where: { responsable: { id: userToDelete.id } },
    });

    for (const eq of equipesResponsables) {
      eq.responsable = null;
      await this.equipeRepository.save(eq);
    }

    // Suppression logique : marquer isDeleted à true
    await this.userRepository.update(id, { isDeleted: true });

    return { message: "L'utilisateur a été désactivé avec succès." };
  } catch (error) {
    throw new InternalServerErrorException("Erreur lors de la désactivation.");
  }
}




async updateProfile(
  userId: number,
  updateUserDto: UpdateUserDto,
): Promise<{
  message: string;
  user: {
    nom: string;
    prenom: string;
    email: string;
    numero: number;
    role: string;
  };
}> {
  if (!userId || isNaN(userId)) {
    throw new BadRequestException('ID utilisateur invalide.');
  }

  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException('Utilisateur non trouvé.');
  }

  // Vérifier si l'email est modifié et s'il est déjà utilisé par un autre utilisateur
  if (
    typeof updateUserDto.email !== 'undefined' &&
    updateUserDto.email !== user.email
  ) {
    const existingUser = await this.userRepository.findOne({
      where: { email: updateUserDto.email },
    });

    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictException('Cet email est déjà utilisé par un autre utilisateur.');
    }

    user.email = updateUserDto.email;
  }

  if (typeof updateUserDto.nom !== 'undefined') {
    user.nom = updateUserDto.nom;
  }

  if (typeof updateUserDto.prenom !== 'undefined') {
    user.prenom = updateUserDto.prenom;
  }

  if (typeof updateUserDto.numero !== 'undefined') {
    user.numero = updateUserDto.numero;
  }

  try {
    const savedUser = await this.userRepository.save(user);

    return {
      message: 'La modification est effectuée avec succès.',
      user: {
        nom: savedUser.nom,
        prenom: savedUser.prenom,
        email: savedUser.email,
        numero: savedUser.numero,
        role: savedUser.role,
      },
    };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du profil:', error);

    // Par exemple, renvoyer une erreur spécifique si c'est un problème de base de données
    throw new InternalServerErrorException('Impossible de modifier le profil. Veuillez réessayer plus tard.');
  }
}


async updatePassword(
    id: number,
    ancienMotDePasse: string,
    nouveauMotDePasse: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Comparer ancien mot de passe avec secret key
    const saltedAncien = this.PASSWORD_SECRET + ancienMotDePasse;
    const isMatch = await bcrypt.compare(saltedAncien, user.motDePasse);

    if (!isMatch) {
      throw new BadRequestException('Ancien mot de passe incorrect');
    }

    // Validation longueur nouveau mot de passe
    if (nouveauMotDePasse.length < 8) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit contenir au moins 8 caractères.',
      );
    }

    // Ajouter le secret et hacher le nouveau mot de passe
    const saltedNouveau = this.PASSWORD_SECRET + nouveauMotDePasse;
    const saltRounds = 10;
    user.motDePasse = await bcrypt.hash(saltedNouveau, saltRounds);

    // Sauvegarde en base
    await this.userRepository.save(user);
    return true;
  }






//method pour réinitialiser le mot de passe
async findByEmail(email: string): Promise<User | null> {
  return this.userRepository.findOne({ where: { email } });
}

async findByResetToken(token: string): Promise<User | null> {
  return this.userRepository.findOne({ where: { resetToken: token } });
}
async findById(id: number): Promise<User | null> {
  return this.userRepository.findOne({ where: { id } });
}


async save(user: User): Promise<User> {
  return this.userRepository.save(user);
}
  async findAvailableCollaborators(requestingUser: any): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.role = :role', { role: 'collaborateur' })
      .andWhere('user.equipeId IS NULL');

    if ((requestingUser.role === 'admin' || requestingUser.role === 'manager') && requestingUser.departementId) {
      query.andWhere('user.departementId = :departementId', {
        departementId: requestingUser.departementId,
      });
    }


    return query.getMany();
  }

  /**
   * Assigns a team to a user and increments the team's member count.
   * This is a transactional operation to ensure data integrity.
   */
  async assignTeam(userId: number, equipeId: number, editor: any): Promise<User> {
    const userToUpdate = await this.userRepository.findOneBy({ id: userId });

    if (!userToUpdate) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }
    if (userToUpdate.role !== 'collaborateur') {
      throw new BadRequestException("Seul un collaborateur peut être assigné à une équipe.");
    }
    if (userToUpdate.equipeId) {
      throw new BadRequestException('Cet utilisateur est déjà dans une équipe.');
    }

    const team = await this.equipeRepository.findOneBy({ id: equipeId });
    if (!team) {
      throw new NotFoundException('Équipe non trouvée.');
    }

    // Authorization Check: Ensure the editor has the right to do this
    if (editor.role === 'admin' && userToUpdate.departementId !== editor.departementId) {
      throw new ForbiddenException("Vous ne pouvez assigner que des utilisateurs de votre département.");
    }
    if (editor.role === 'manager' && team.id !== editor.equipeId) {
      throw new ForbiddenException("Vous ne pouvez assigner des utilisateurs qu'à votre propre équipe.");
    }

    // Use a transaction to safely update both user and team
    return this.userRepository.manager.transaction(async (transactionalEntityManager) => {
      userToUpdate.equipe = team;
      team.nbMembres = (team.nbMembres || 0) + 1;

      await transactionalEntityManager.save(userToUpdate);
      await transactionalEntityManager.save(team);
      const savedUser = await transactionalEntityManager.save(userToUpdate);

      return this.toSafeUser(savedUser);
    });
  }
  async assignPosition(userId: number, posteId: number | null): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    if (posteId === null) {

      user.poste = null;
    } else {

      user.poste = { id: posteId } as any;
    }

    const savedUser = await this.userRepository.save(user);
    return this.toSafeUser(savedUser);
  }

  async findAllByTeam(teamId: number): Promise<User[]> {
    const users = await this.userRepository.find({
      where: { equipe: { id: teamId } },
    });
    return users.map(user => this.toSafeUser(user));
  }

  async findAvailableAdmins(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        role: 'admin',
        departement: IsNull(),
      },
    });
  }

  async findAvailableDepartmentHeads(): Promise<User[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', {
        roles: ['admin', 'manager', 'collaborateur'],
      })
      .andWhere('user.departementId IS NULL')
      .getMany();
    return users.map(user => this.toSafeUser(user));
  }

  async findUsersByDepartmentPaginated(
    departmentId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: User[]; total: number }> {
    const [data, total] = await this.userRepository.findAndCount({
      where: { departement: { id: departmentId } },
      take: limit,
      skip: (page - 1) * limit,
      order: { nom: 'ASC' },
    });
    const safeData = data.map(user => this.toSafeUser(user));
    return { data: safeData, total };
  }


  async unassignDepartment(userId: number): Promise<User> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: userId },
        relations: ['departement', 'departement.responsable'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }

      const department = user.departement;

      if (department && department.responsable?.id === user.id) {
        department.responsable = null;
        await transactionalEntityManager.save(department);
      }

      if (user.role === 'admin') {
        user.role = 'collaborateur';
      }

      user.departement = null;

      const savedUser = await transactionalEntityManager.save(user);
      return this.toSafeUser(savedUser);
    });
  }

  async assignDepartment(userId: number, departmentId: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    user.departement = { id: departmentId } as Departement;
    const savedUser = await this.userRepository.save(user);
    return this.toSafeUser(savedUser);
  }

  async findUsersByTeamPaginated(
    teamId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: User[]; total: number }> {
    const [data, total] = await this.userRepository.findAndCount({
      where: { equipe: { id: teamId } },
      take: limit,
      skip: (page - 1) * limit,
      order: { nom: 'ASC' },
    });
    const safeData = data.map(user => this.toSafeUser(user));
    return { data: safeData, total };
  }

  async unassignTeam(userId: number): Promise<User> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: userId },
        relations: ['equipe'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }

      const team = user.equipe;

      if (team) {
        const teamToUpdate = await transactionalEntityManager.findOne(Equipe, {
          where: { id: team.id },
          relations: ['responsable'],
        });

        if (teamToUpdate) {
          teamToUpdate.nbMembres = Math.max(0, teamToUpdate.nbMembres - 1);

          if (teamToUpdate.responsable?.id === user.id) {
            teamToUpdate.responsable = null;
          }
          await transactionalEntityManager.save(teamToUpdate);
        }
      }

      if (user.role === 'manager') {
        user.role = 'collaborateur';
      }

      user.equipe = null;
      user.equipeId = null;
      const savedUser = await transactionalEntityManager.save(user);
      return this.toSafeUser(savedUser);
    });
  }

  async findAvailableTeamLeads(currentUser: any): Promise<User[]> {
    const subQuery = this.equipeRepository.createQueryBuilder("equipe")
      .select("equipe.responsableEquipeId")
      .where("equipe.responsableEquipeId IS NOT NULL");

    const query = this.userRepository.createQueryBuilder("user")
      .where('user.role IN (:...roles)', { roles: ['manager', 'collaborateur'] })
      .andWhere(`user.id NOT IN (${subQuery.getQuery()})`);

    if (currentUser.role === 'admin' && currentUser.departementId) {
      query.andWhere('user.departementId = :departementId', {
        departementId: currentUser.departementId
      });
    }

    const users = await query.getMany();
    return users.map(user => this.toSafeUser(user));
  }

  async findUsersWithIncompletePlanning(): Promise<User[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + (8 - today.getDay()) % 7);
    if (today.getDay() === 1) nextMonday.setDate(today.getDate() + 7);

    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);

    const requiredDays = 5;

    const subQuery = this.dataSource.createQueryBuilder()
      .select("planning.userId")
      .from(Planning, "planning")
      .where("planning.date BETWEEN :start AND :end", { start: nextMonday, end: nextFriday })
      .groupBy("planning.userId")
      .having("COUNT(planning.id) >= :requiredDays", { requiredDays });

    return this.userRepository.createQueryBuilder("user")
      .where(`user.id NOT IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters())
      .getMany();
  }


  //methodes pour recupere les utilisateurs d'un département pour un admin


async addCompensation(reqUser: any, userId?: number, jours?: number) {
  const currentUserId = Number(reqUser.sub || reqUser.userId);
  const currentUser = await this.userRepository.findOne({ where: { id: currentUserId } });

  if (!currentUser) throw new NotFoundException('Utilisateur introuvable');
  if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    throw new ForbiddenException("Non autorisé");
  }
  if (!currentUser.departementId) {
    throw new BadRequestException("Votre profil ne contient pas de département");
  }

  if (!userId) {
    return this.userRepository.find({
      where: { 
        departementId: currentUser.departementId,
        isDeleted: false,
        id: Not(currentUserId), // 🔥 exclure l'admin connecté
      },
      select: ['id', 'nom', 'prenom', 'soldeCompensation'],
    });
  }

  if (jours === undefined) {
    throw new BadRequestException("Le nombre de jours est requis pour ajouter une compensation");
  }

  const user = await this.userRepository.findOne({
    where: { id: userId, departementId: currentUser.departementId },
  });

  if (!user) throw new NotFoundException("Utilisateur introuvable ou hors de votre département");

  user.soldeCompensation = Number(user.soldeCompensation) + jours;
  await this.userRepository.save(user);

  return { message: `Compensation ajoutée. Nouveau solde: ${user.soldeCompensation}` };
}








  async findAllUsersSimple(currentUser: any): Promise<User[]> {
    const users = await this.userRepository.find({
      where: {
        id: Not(currentUser.userId)
      },
      order: { prenom: 'ASC' },
    });
    return users.map(user => this.toSafeUser(user));
  }

  async findUsersByDepartment(departmentId: number): Promise<User[]> {
    const users = await this.userRepository.find({
      where: {
        departement: { id: departmentId },
        role: 'collaborateur'
      }
    });
    return users.map(user => this.toSafeUser(user));
  }

}