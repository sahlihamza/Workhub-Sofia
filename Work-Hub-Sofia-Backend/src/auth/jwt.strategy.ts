import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config'; // Ajouter

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'S9$e7vX!mR2pLd@zW4cBfTqYjKx#HgA8nD%VuE3oZ', // valeur par défaut
    });
  }

  async validate(payload: any) {
    return { 
      userId: payload.sub, 
      nom: payload.nom,
      prenom: payload.prenom,
      email: payload.email, 
      numero: payload.numero,
      role: payload.role ,
      departementId: payload.departementId,
      equipeId: payload.equipeId,
      solde:payload.soldeConge
    };
  }
}