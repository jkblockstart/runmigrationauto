import {MigrationInterface, QueryRunner} from "typeorm";

export class abc1632480811636 implements MigrationInterface {
    name = 'abc1632480811636'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contact_us" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "email" character varying, "subject" character varying, "message" character varying, "requestType" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_b61766a4d93470109266b976cfe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admin_bids" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "username" character varying, "amount" character varying, "bidSource" integer, "txnHash" character varying, "status" integer, "message" character varying, CONSTRAINT "PK_b7d01c1bc8fc92c7c7ea3783888" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "operators" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "onboardingEmailSender" character varying, "name" character varying, "email" character varying, "addedBy" character varying, CONSTRAINT "PK_3d02b3692836893720335a79d1b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ipf_slist" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "userId" character varying NOT NULL, "ipfs" character varying NOT NULL, CONSTRAINT "PK_eacc2c676f99488c7e73161ffbc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "nft_carousel" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "imageLink" character varying NOT NULL, "redirectLink" character varying NOT NULL, "addedBy" character varying NOT NULL, "name" character varying, "description" character varying, "active" boolean NOT NULL DEFAULT false, "operatorId" integer NOT NULL DEFAULT '1', CONSTRAINT "UQ_2f5914820197fd6c50f9a864ee7" UNIQUE ("name"), CONSTRAINT "PK_aee5bf3f2f7eb5994a50c0cd6d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "configurations" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "name" character varying NOT NULL, "value" integer NOT NULL, "type" integer NOT NULL, "operatorId" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_ef9fc29709cc5fc66610fc6a664" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "metadata" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "name" character varying, "image" character varying, "description" character varying, "assetCon" character varying, "collection" character varying, "assetId" integer, "schema" character varying, "addedBy" character varying, CONSTRAINT "PK_56b22355e89941b9792c04ab176" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "owen_tokens" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "userId" character varying NOT NULL, "amount" integer NOT NULL, "paymentId" character varying, CONSTRAINT "PK_9e759e5eba8faf7980fc34e6654" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transferred_assets" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "assetId" character varying NOT NULL, "userId" character varying NOT NULL, "recipient" character varying NOT NULL, "transferType" integer, "status" boolean NOT NULL DEFAULT false, "assetCon" character varying, "blockchain" integer, "comment" character varying, CONSTRAINT "PK_e961009900c8eb5d184c120550b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "collections" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "collection" character varying NOT NULL, "collectionName" character varying NOT NULL, "collectionImage" character varying NOT NULL, "collectionCoverImage" character varying, "collectionDescription" character varying, "isFeatured" boolean NOT NULL DEFAULT false, "txnStatus" boolean NOT NULL DEFAULT false, "txnMessage" character varying, "txnId" character varying, "addedBy" character varying NOT NULL, "assetCon" character varying, "paymentId" character varying, "operatorId" integer NOT NULL DEFAULT '1', "addedByRole" integer NOT NULL DEFAULT '2', "blockchain" integer NOT NULL DEFAULT '1', "isHighlight" boolean NOT NULL DEFAULT false, "rank" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_21c00b1ebbd41ba1354242c5c4e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "added_schemas" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "collectionId" character varying, "schema" character varying, "addedBy" character varying NOT NULL, "schemaFormat" character varying NOT NULL, "txnStatus" boolean NOT NULL DEFAULT false, "txnMessage" character varying, "txnId" character varying, CONSTRAINT "PK_fd0ea99d2ae2c80028563124be7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "added_templates" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "collectionId" character varying, "schema" character varying, "addedBy" character varying NOT NULL, "templateData" character varying NOT NULL, "maxSupply" integer NOT NULL, "txnStatus" boolean NOT NULL DEFAULT false, "txnMessage" character varying, "txnId" character varying, "templateId" integer, CONSTRAINT "PK_318eafde52be1567b1fb1e61f77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pending_assets" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "saleId" integer NOT NULL, "assetId" integer NOT NULL, "userId" character varying NOT NULL, CONSTRAINT "PK_1d22b02fb34bc375162fc2be505" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assets_highlights" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "assetId" character varying NOT NULL, "userId" character varying NOT NULL, "assetCon" character varying NOT NULL, "blockchain" integer NOT NULL, "isHighlight" boolean NOT NULL, "operatorId" integer NOT NULL DEFAULT '1', "rank" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_520ce46e6df134c6f6158ecdea0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payments" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "userId" character varying NOT NULL, "username" character varying, "amount" integer NOT NULL DEFAULT '0', "currency" character varying NOT NULL, "stripePaymentDescription" character varying, "status" integer, "paymentFor" integer, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sales" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "collectionId" character varying, "templateId" integer, "templateName" character varying, "templateDescription" character varying, "templateImage" character varying, "schema" character varying, "price" integer, "limitPerUser" integer, "maxIssue" integer, "queueType" integer, "queueInitialized" boolean NOT NULL DEFAULT false, "isFreePack" boolean NOT NULL DEFAULT false, "saleStartTime" TIMESTAMP, "saleEndTime" TIMESTAMP, "registrationStartTime" TIMESTAMP, "registrationEndTime" TIMESTAMP, "unpackStartTime" TIMESTAMP, "addedBy" character varying, "assetCon" character varying, "txnStatus" boolean NOT NULL DEFAULT false, "txnMessage" character varying, "txnId" character varying, "queueConfigurationInitialized" boolean NOT NULL DEFAULT false, "isFeatured" boolean NOT NULL DEFAULT true, "isReRegistrationEnabled" boolean NOT NULL DEFAULT true, "isEnabled" boolean NOT NULL DEFAULT true, "showCollectionName" boolean NOT NULL DEFAULT true, "queueInitializationTime" TIMESTAMP, "blockchain" integer DEFAULT null, "paymentId" character varying, "operatorId" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ethereum_sales" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "saleId" integer, "assetCon" character varying, "mintOnBuy" boolean NOT NULL DEFAULT false, "from" integer NOT NULL, "to" integer NOT NULL, CONSTRAINT "PK_baf73859eb242b52ed90fbcd53d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sale_queue" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "saleId" integer NOT NULL, "intervalSeconds" integer NOT NULL, "minRank" integer, "maxRank" integer, "addedBy" character varying NOT NULL, "slotStartTime" TIMESTAMP, "slotEndTime" TIMESTAMP, "txnStatus" boolean NOT NULL DEFAULT false, "txnMessage" character varying, "txnId" character varying, CONSTRAINT "PK_4a439034f0ec6ad36d31b0f66e0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sale_registration" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "saleId" integer, "userId" character varying NOT NULL, "username" character varying NOT NULL, "rank" integer NOT NULL, CONSTRAINT "PK_084bade13b18d75090d14ecdf26" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sold_templates" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "templateId" integer, "saleId" integer NOT NULL, "userId" character varying NOT NULL, "units" integer NOT NULL, "amount" integer NOT NULL, "currency" character varying NOT NULL, "txnStatus" boolean NOT NULL DEFAULT false, "txnMessage" character varying, "txnId" character varying, "paymentId" character varying, CONSTRAINT "PK_b892ad37eeb18e4731ca3a38de1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admin_registration" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "username" character varying, "amount" character varying, "bidSource" integer, "txnHash" character varying, "status" integer, "message" character varying, CONSTRAINT "PK_af2e1356699e8dabc47aab27f12" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "email" character varying, "deleted" boolean NOT NULL DEFAULT false, "emailVerified" boolean NOT NULL DEFAULT false, "username" character varying, "name" character varying, "fbId" character varying, "instaId" character varying, "customerId" character varying, "currentOperatorId" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "email_verifications" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "user" character varying NOT NULL, "code" integer NOT NULL, CONSTRAINT "PK_9332966aa868f7ba78dc54648c2" PRIMARY KEY ("user"))`);
        await queryRunner.query(`CREATE TABLE "reset_passwords" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "user" character varying NOT NULL, "code" integer NOT NULL, CONSTRAINT "PK_87405336410c2a302c39ab8b697" PRIMARY KEY ("user"))`);
        await queryRunner.query(`CREATE TABLE "wax_accounts" ("created" TIMESTAMP NOT NULL DEFAULT now(), "modified" TIMESTAMP NOT NULL DEFAULT now(), "id" character varying NOT NULL, "userId" character varying NOT NULL, "account" character varying NOT NULL, CONSTRAINT "PK_a8ff42609df11f223ff8dbe4d02" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "wax_accounts"`);
        await queryRunner.query(`DROP TABLE "reset_passwords"`);
        await queryRunner.query(`DROP TABLE "email_verifications"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "admin_registration"`);
        await queryRunner.query(`DROP TABLE "sold_templates"`);
        await queryRunner.query(`DROP TABLE "sale_registration"`);
        await queryRunner.query(`DROP TABLE "sale_queue"`);
        await queryRunner.query(`DROP TABLE "ethereum_sales"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "assets_highlights"`);
        await queryRunner.query(`DROP TABLE "pending_assets"`);
        await queryRunner.query(`DROP TABLE "added_templates"`);
        await queryRunner.query(`DROP TABLE "added_schemas"`);
        await queryRunner.query(`DROP TABLE "collections"`);
        await queryRunner.query(`DROP TABLE "transferred_assets"`);
        await queryRunner.query(`DROP TABLE "owen_tokens"`);
        await queryRunner.query(`DROP TABLE "metadata"`);
        await queryRunner.query(`DROP TABLE "configurations"`);
        await queryRunner.query(`DROP TABLE "nft_carousel"`);
        await queryRunner.query(`DROP TABLE "ipf_slist"`);
        await queryRunner.query(`DROP TABLE "operators"`);
        await queryRunner.query(`DROP TABLE "admin_bids"`);
        await queryRunner.query(`DROP TABLE "contact_us"`);
    }

}