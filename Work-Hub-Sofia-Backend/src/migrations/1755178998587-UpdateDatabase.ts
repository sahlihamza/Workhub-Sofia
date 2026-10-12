import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDatabase1755178998587 implements MigrationInterface {
    name = 'UpdateDatabase1755178998587'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`demande_conge\` (\`id\` int NOT NULL AUTO_INCREMENT, \`dateDebut\` date NOT NULL, \`dateFin\` date NOT NULL, \`cause\` varchar(255) NOT NULL, \`type\` enum ('conge', 'conge_maladie', 'compensation') NOT NULL DEFAULT 'conge', \`duree\` decimal(5,2) NOT NULL DEFAULT '0.00', \`statut\` enum ('en_attente', 'confirmee', 'rejettee') NOT NULL DEFAULT 'en_attente', \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`equipe\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nomEquipe\` varchar(255) NOT NULL, \`descriptionEquipe\` varchar(255) NOT NULL, \`nbMembres\` int NOT NULL DEFAULT '0', \`responsableEquipeId\` int NULL, \`departementId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`departement\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nomDepartement\` varchar(255) NOT NULL, \`descriptionDepartement\` text NOT NULL, \`nbEquipe\` int NOT NULL DEFAULT '0', \`statut\` tinyint NOT NULL DEFAULT 1, \`responsableId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`postes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nom_poste\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`planning\` (\`id\` int NOT NULL AUTO_INCREMENT, \`date\` date NOT NULL, \`status\` enum ('present', 'remote') NOT NULL, \`notes\` text NULL, \`userId\` int NULL, UNIQUE INDEX \`IDX_d695428d99f25c26f0202439ad\` (\`userId\`, \`date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nom\` varchar(255) NOT NULL, \`prenom\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`motDePasse\` varchar(255) NOT NULL, \`numero\` int NOT NULL, \`role\` varchar(255) NOT NULL, \`departementId\` int NULL, \`resetToken\` varchar(255) NULL, \`resetTokenExpiration\` datetime NULL, \`equipeId\` int NULL, \`soldeConge\` float NOT NULL DEFAULT '0', \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`soldeCongeMaladie\` decimal(5,2) NOT NULL DEFAULT '0.00', \`soldeCompensation\` decimal(5,2) NOT NULL DEFAULT '0.00', \`id_poste\` int NULL, UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`demande_conge\` ADD CONSTRAINT \`FK_e357bb063f185fbf38aeb9dd0e3\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`equipe\` ADD CONSTRAINT \`FK_e3b61fbd988a6d33416c94bcb3f\` FOREIGN KEY (\`responsableEquipeId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`equipe\` ADD CONSTRAINT \`FK_e9775aab18a87017abcf8669b6c\` FOREIGN KEY (\`departementId\`) REFERENCES \`departement\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`departement\` ADD CONSTRAINT \`FK_e735c664a948fae1c28f137302b\` FOREIGN KEY (\`responsableId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`planning\` ADD CONSTRAINT \`FK_da7aae771071b1af9f6041dec50\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_47eaf43f335b03e6102542559d2\` FOREIGN KEY (\`departementId\`) REFERENCES \`departement\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_5abe6939a695d51280f2b674b86\` FOREIGN KEY (\`equipeId\`) REFERENCES \`equipe\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_ade36a4cbf5d8c01ba95a5a1af5\` FOREIGN KEY (\`id_poste\`) REFERENCES \`postes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_ade36a4cbf5d8c01ba95a5a1af5\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_5abe6939a695d51280f2b674b86\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_47eaf43f335b03e6102542559d2\``);
        await queryRunner.query(`ALTER TABLE \`planning\` DROP FOREIGN KEY \`FK_da7aae771071b1af9f6041dec50\``);
        await queryRunner.query(`ALTER TABLE \`departement\` DROP FOREIGN KEY \`FK_e735c664a948fae1c28f137302b\``);
        await queryRunner.query(`ALTER TABLE \`equipe\` DROP FOREIGN KEY \`FK_e9775aab18a87017abcf8669b6c\``);
        await queryRunner.query(`ALTER TABLE \`equipe\` DROP FOREIGN KEY \`FK_e3b61fbd988a6d33416c94bcb3f\``);
        await queryRunner.query(`ALTER TABLE \`demande_conge\` DROP FOREIGN KEY \`FK_e357bb063f185fbf38aeb9dd0e3\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_d695428d99f25c26f0202439ad\` ON \`planning\``);
        await queryRunner.query(`DROP TABLE \`planning\``);
        await queryRunner.query(`DROP TABLE \`postes\``);
        await queryRunner.query(`DROP TABLE \`departement\``);
        await queryRunner.query(`DROP TABLE \`equipe\``);
        await queryRunner.query(`DROP TABLE \`demande_conge\``);
    }

}
