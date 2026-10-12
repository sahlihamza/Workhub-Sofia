
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { addMinutes, isBefore } from 'date-fns';
import * as bcrypt from 'bcrypt';      

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
     private userService: UserService,         // Ajouté
    private mailerService: MailerService,     // Ajouté (pour envoyer l'email)
  ) {}

  private getPayload(user: User) {
    return {
      sub: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      departementId: user.departement?.id ?? null,
      equipeId: user.equipe?.id ?? null,
    };
  }

  // async login(email: string, motDePasse: string) {
  //   const user = await this.userRepository.findOne({
  //     where: { email },
  //     relations: ['departement', 'equipe'],
  //   });

  //   if (user && user.motDePasse === motDePasse) {
  //     const payload = this.getPayload(user);

  //     const accessToken = this.jwtService.sign(payload, {
  //       secret: process.env.JWT_ACCESS_SECRET,
  //       expiresIn: '2h',
  //     });

  //     const refreshToken = this.jwtService.sign(payload, {
  //       secret: process.env.JWT_REFRESH_SECRET,
  //       expiresIn: '12h',
  //     });

  //     const { motDePasse, ...result } = user;

  //     return {
  //       access_token: accessToken,
  //       refresh_token: refreshToken,
  //       //cette ligne de code retourne les informations de l'utilisateur sans le mot de passe
  //       // user: result,*
  //       // juste le nom et l'email
  //       user: {
  //       nom: user.nom,
  //       email: user.email,
  //     },
  //     };
  //   }

  //   throw new UnauthorizedException('Email ou mot de passe invalide');
  // }

  async login(email: string, motDePasse: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['departement', 'equipe'],
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    // On ajoute la clé secrète avant comparaison
    const passwordSecret = this.configService.get<string>('PASSWORD_SECRET') || '';
    const saltedPassword = passwordSecret + motDePasse;

    // Comparaison avec bcrypt
    const isMatch = await bcrypt.compare(saltedPassword, user.motDePasse);

    if (!isMatch) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    const payload = this.getPayload(user);

    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      this.configService.get<string>('JWT_SECRET');
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET');

    if (!accessSecret || !refreshSecret) {
      throw new InternalServerErrorException('La configuration JWT est incomplète');
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: '2h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '12h',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        nom: user.nom,
        email: user.email,
      },
    };
  }


  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['departement', 'equipe'],
      });

      if (!user) throw new UnauthorizedException();

      const newAccessToken = this.jwtService.sign(this.getPayload(user), {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      });

      return {
        access_token: newAccessToken,
      };
    } catch (err) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  async sendResetPasswordEmail(email: string): Promise<{ message: string }> {
    // Chercher l'utilisateur
    const user = await this.userService.findByEmail(email);
    if (!user) {
      // Pas d'utilisateur trouvé -> erreur 404 ou message plus générique pour sécurité
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Générer token + expiration
    const token = randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiration = addMinutes(new Date(), 15);

    await this.userService.save(user);

const resetLink = `${process.env.FRONTEND_URL}/new-password?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Réinitialisation de mot de passe',
        // Si tu n'utilises pas de template, tu peux juste envoyer du texte / html ici
        text: `Bonjour ${user.nom},\nCliquez sur ce lien pour réinitialiser votre mot de passe: ${resetLink}`,
        html: `
          <p>Bonjour ${user.nom},</p>
          <p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p>
          <a href="${resetLink}" target="_blank">${resetLink}</a>
        `,
      });
    } catch (error) {
      // Log erreur et renvoyer erreur serveur
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw new InternalServerErrorException('Erreur lors de l\'envoi de l\'email');
    }

    // Retourne un message clair côté API
    return { message: 'Email de réinitialisation envoyé avec succès' };
  }

//   async resetPassword(resetToken: string, motDePasse: string): Promise<{ message: string }> {
//   if (!motDePasse || motDePasse.trim() === '') {
//     throw new BadRequestException('Le mot de passe est requis');
//   }

//   if (motDePasse.length < 8) {
//     throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
//   }

//   const user = await this.userService.findByResetToken(resetToken);

//   if (!user || !user.resetTokenExpiration || isBefore(user.resetTokenExpiration, new Date())) {
//     // throw new BadRequestException('Token invalide ou expiré');
//     throw new BadRequestException('Veuillez demander un nouveau lien de réinitialisation.');
//   }

//   // user.motDePasse = await bcrypt.hash(motDePasse, 10);
//   user.motDePasse = motDePasse;

//   user.resetToken = null;
//   user.resetTokenExpiration = null;

//   await this.userService.save(user);

//   return { message: 'Mot de passe réinitialisé avec succès' };
// }

async resetPassword(resetToken: string, motDePasse: string): Promise<{ message: string }> {
  if (!motDePasse || motDePasse.trim() === '') {
    throw new BadRequestException('Le mot de passe est requis');
  }

  if (motDePasse.length < 8) {
    throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
  }

  const user = await this.userService.findByResetToken(resetToken);

  if (!user || !user.resetTokenExpiration || isBefore(user.resetTokenExpiration, new Date())) {
    throw new BadRequestException('Veuillez demander un nouveau lien de réinitialisation.');
  }

  // Ajout de la clé secrète au mot de passe avant hachage
  const passwordSecret = this.configService.get<string>('PASSWORD_SECRET') || '';
  const saltedPassword = passwordSecret + motDePasse;

  // Hashage avec bcrypt (avec saltRounds = 10 par exemple)
  user.motDePasse = await bcrypt.hash(saltedPassword, 10);

  user.resetToken = null;
  user.resetTokenExpiration = null;

  await this.userService.save(user);

  return { message: 'Mot de passe réinitialisé avec succès' };
}



}
