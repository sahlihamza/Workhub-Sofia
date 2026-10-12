import { Injectable } from '@nestjs/common';
import { CreateMailDto } from './dto/create-mail.dto';
import { UpdateMailDto } from './dto/update-mail.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { DemandeConge } from 'src/demande-conge/entities/demande-conge.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipe } from 'src/equipe/entities/equipe.entity';
import { User } from 'src/user/entities/user.entity';
import { Planning } from '../planning/entities/planning.entity';

@Injectable()
export class MailService {

  constructor(private readonly mailerService: MailerService,@InjectRepository(User) private userRepository: Repository<User>,
  @InjectRepository(Equipe) private equipeRepository: Repository<Equipe>,) {}

  async sendResetPasswordEmail(to: string, resetLink: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Réinitialisation de votre mot de passe',
      text: `Bonjour, cliquez sur ce lien pour réinitialiser votre mot de passe: ${resetLink}`,
      html: `
        <p>Bonjour,</p>
        <p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
      `,
    });
  }


  async sendDemandeConfirmeeEmail(to: string, nom: string, dateDemande: string, dateDebut: string,dateFin: string) 
  {
  try {
    await this.mailerService.sendMail({
      to,
      subject: 'Approbation de votre demande de congé',
      html: `
        <p>Bonjour ${nom},</p>
        <p>Votre demande de congé soumise le <strong>${dateDemande}</strong> 
        <p>Période du congé : du <strong>${dateDebut}</strong> au <strong>${dateFin}</strong>
        a été approuvée. Vous pouvez consulter les détails de votre congé dans votre profil sur la plateforme.</p>
        <p>Merci.</p>
        <p>Cordialement,<br>L'équipe de gestion des congés</p>
      `,
    });
  } catch (error) {
    console.error('Erreur lors de l’envoi de l’email d’approbation:', error);
    throw new Error('Impossible d\'envoyer l\'email de notification, veuillez réessayer.');
  }
}

async sendDemandeRejeteeEmail(to: string, nom: string,dateDemande: string, dateDebut: string, dateFin: string) {
  try {
    await this.mailerService.sendMail({
      to,
      subject: 'Demande de congé rejetée',
      html: `
        <p>Bonjour ${nom},</p>
        <p>Votre demande de congé soumise le <strong>${dateDemande}</strong>
        <p>Période du congé : du <strong>${dateDebut}</strong> au <strong>${dateFin}</strong>
        </p> <strong>n'a pas été approuvée</strong>. Veuillez contacter votre responsable pour plus d’informations.</p>
        <p>Cordialement,<br>L'équipe de gestion des congés</p>
      `,
    });
  } catch (error) {
    console.error('Erreur lors de l’envoi de l’email de rejet:', error);
    throw new Error('Impossible d\'envoyer l\'email de notification, veuillez réessayer.');
  }
}

async sendNotificationNouvelleDemande(demande: DemandeConge) {
  const demandeUser = await this.userRepository.findOne({
    where: { id: demande.user.id },
    relations: ['equipe', 'departement'], 
  });

  if (!demandeUser) {
    throw new Error("Utilisateur lié à la demande non trouvé");
  }

  let destinataire: User | null = null;

  switch (demandeUser.role) {
    case 'collaborateur':
      // Notifier le manager (responsable de l'équipe)
      if (!demandeUser.equipe) {
        throw new Error("Collaborateur sans équipe assignée");
      }
      const equipe = await this.equipeRepository.findOne({
        where: { id: demandeUser.equipe.id },
        relations: ['responsable'],
      });
      if (!equipe || !equipe.responsable) {
        throw new Error("Equipe sans manager responsable");
      }
      destinataire = equipe.responsable;
      break;

    case 'manager':
      // Notifier l'admin du même département
      if (!demandeUser.departementId) {
        throw new Error("Manager sans département");
      }
      destinataire = await this.userRepository.findOne({
        where: { role: 'admin', departementId: demandeUser.departementId },
      });
      if (!destinataire) {
        throw new Error("Aucun admin trouvé pour ce département");
      }
      break;

    case 'admin':
      // Notifier le superadmin (unique)
      destinataire = await this.userRepository.findOne({
        where: { role: 'superadmin' },
      });
      if (!destinataire) {
        throw new Error("Superadmin non trouvé");
      }
      break;

    default:
      console.log("Rôle non pris en charge pour notification");
      return;
  }

  
 const dateDebut = new Date(demande.dateDebut).toLocaleDateString();
const dateFin = new Date(demande.dateFin).toLocaleDateString();
const dateDemande = demande.createdAt ? new Date(demande.createdAt).toLocaleDateString() : '';


  // Envoyer mail à la personne responsable
  try {
    await this.mailerService.sendMail({
      to: destinataire.email,
      subject: 'Nouvelle demande de congé à valider',
      html: `
        <p>Bonjour ${destinataire.nom},</p>
        <p>Une nouvelle demande de congé a été soumise par <strong>${demandeUser.nom} ${demandeUser.prenom}</strong> le <strong>${dateDemande}</strong>.</p>
        <p>Période : du <strong>${dateDebut}</strong> au <strong>${dateFin}</strong>.</p>
        <p>Merci de vous connecter à la plateforme pour valider ou refuser cette demande.</p>
        <p>Cordialement,<br>L'équipe de gestion des congés</p>
      `,
    });
  } catch (error) {
    console.error(`Erreur lors de l’envoi de la notification à ${destinataire.email}:`, error);
  }
}

async sendPasswordCreatedEmail(to: string, password: string) {
  await this.mailerService.sendMail({
    to,
    subject: 'Votre compte a été créé',
    html: `
      <p>Bonjour,</p>
      <p>Votre compte utilisateur a été créé avec succès.</p>
      <p>Voici votre mot de passe temporaire : <strong>${password}</strong></p>
      <p>Merci de vous connecter et de changer ce mot de passe dès que possible.</p>
      <p>Cordialement,<br>L'équipe de gestion</p>
    `,
  });
}



  create(createMailDto: CreateMailDto) {
    return 'This action adds a new mail';
  }

  findAll() {
    return `This action returns all mail`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mail`;
  }

  update(id: number, updateMailDto: UpdateMailDto) {
    return `This action updates a #${id} mail`;
  }

  remove(id: number) {
    return `This action removes a #${id} mail`;
  }

  async sendPlanningReminderEmail(to: string) {
    const content = `
    <p>Hello,</p>
    <p>This is a friendly reminder to please fill out your work planning (on site/remote) for the upcoming week.</p>
    <p>Thank you!</p>
  `;

    await this.mailerService.sendMail({
      to,
      subject: 'Reminder: Complete Your Planning for Next Week',
      html: this._wrapWithTemplate(content),
      attachments: [{
        filename: 'ST2.png',
        path: 'src/assets/img/brand/ST2.png',
        cid: 'logo'
      }]
    });
  }

  async sendPlanningUpdateNotification(targetUser: User, entry: Planning, editor: any) {
    const editorName = `${editor.prenom} ${editor.nom}`;
    const entryDate = new Date(entry.date).toLocaleDateString('en-GB');

    const content = `
    <p>Hello ${targetUser.prenom},</p>
    <p>Please be advised that your work planning for the date <b>${entryDate}</b> has been updated by an administrator (${editorName}).</p>
    <p>Your new status for this day is: <b>${entry.status}</b>.</p>
    <p>Thank you.</p>
  `;

    await this.mailerService.sendMail({
      to: targetUser.email,
      subject: `Your planning has been updated for ${entryDate}`,
      html: this._wrapWithTemplate(content),
      attachments: [{
        filename: 'ST2.png',
        path: 'src/assets/img/brand/ST2.png',
        cid: 'logo'
      }]
    });
  }

  private _wrapWithTemplate(content: string): string {

    const logoUrl = `cid:logo`;
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Notification</title></head>
    <body style="margin: 0; padding: 0; font-family: 'Open Sans', sans-serif; background-color: #f6f9fc;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; box-shadow: 0 0 20px rgba(0,0,0,0.05); border-radius: 5px; overflow: hidden;">
            <tr>
                <td align="center" bgcolor="#FFFFFF" style="padding: 20px 0;">
                    <img src="${logoUrl}" alt="Company Logo" style="display: block; max-height: 130px;">
                </td>
            </tr>
            <tr>
                <td bgcolor="#ffffff" style="padding: 40px 30px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                        <tr>
                            <td style="color: #32325d; font-size: 16px; line-height: 24px;">
                                ${content}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td bgcolor="#f6f9fc" style="padding: 20px 30px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                        <tr>
                            <td align="center" style="color: #ec8b00; font-size: 12px;">
                                &copy; ${new Date().getFullYear()} Work Hub Sofia. All rights reserved.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
  }
}
