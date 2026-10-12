import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompleteSeedSchema1755180000000 implements MigrationInterface {
  name = 'CompleteSeedSchema1755180000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `postes` ADD COLUMN `description` text NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `postes` ADD COLUMN `departementId` int NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `postes` ADD CONSTRAINT `FK_postes_departement` FOREIGN KEY (`departementId`) REFERENCES `departement`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'CREATE TABLE `campaigns` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `description` text NULL, `start_date` date NOT NULL, `end_date` date NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `campaigns`');
    await queryRunner.query(
      'ALTER TABLE `postes` DROP FOREIGN KEY `FK_postes_departement`',
    );
    await queryRunner.query('ALTER TABLE `postes` DROP COLUMN `departementId`');
    await queryRunner.query('ALTER TABLE `postes` DROP COLUMN `description`');
  }
}
