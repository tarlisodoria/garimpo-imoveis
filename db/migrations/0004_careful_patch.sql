CREATE TYPE "public"."checkout_asaas_status" AS ENUM('pendente', 'pago', 'cancelado', 'expirado', 'falha');--> statement-breakpoint
CREATE TYPE "public"."status_assinatura" AS ENUM('trial', 'ativa', 'inadimplente', 'cancelada', 'expirada');--> statement-breakpoint
CREATE TABLE "checkouts_asaas" (
	"referencia" varchar(64) PRIMARY KEY NOT NULL,
	"checkout_id" text,
	"user_id" text NOT NULL,
	"plano" text NOT NULL,
	"status" "checkout_asaas_status" DEFAULT 'pendente' NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkouts_asaas_checkout_id_unique" UNIQUE("checkout_id")
);
--> statement-breakpoint
CREATE TABLE "webhooks_asaas" (
	"id_evento" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"processado_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "perfis" ALTER COLUMN "status_assinatura" SET DATA TYPE "public"."status_assinatura" USING "status_assinatura"::"public"."status_assinatura";--> statement-breakpoint
ALTER TABLE "perfis" ADD COLUMN "status_assinatura_desde" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "checkouts_asaas" ADD CONSTRAINT "checkouts_asaas_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkouts_asaas_user_status_idx" ON "checkouts_asaas" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "checkouts_asaas_um_pendente_por_usuario_idx" ON "checkouts_asaas" USING btree ("user_id") WHERE "checkouts_asaas"."status" = 'pendente';--> statement-breakpoint
CREATE INDEX "webhooks_asaas_processado_em_idx" ON "webhooks_asaas" USING btree ("processado_em");--> statement-breakpoint
CREATE INDEX "eventos_criado_em_idx" ON "eventos" USING btree ("criado_em");--> statement-breakpoint
CREATE UNIQUE INDEX "perfis_asaas_customer_id_idx" ON "perfis" USING btree ("asaas_customer_id");
--> statement-breakpoint
UPDATE "perfis" AS p
SET
	"status_assinatura" = CASE
		WHEN (u."created_at" AT TIME ZONE 'UTC') + interval '7 days' > now()
			THEN 'trial'::"public"."status_assinatura"
		ELSE 'expirada'::"public"."status_assinatura"
	END,
	"status_assinatura_desde" = u."created_at" AT TIME ZONE 'UTC',
	"trial_ate" = (u."created_at" AT TIME ZONE 'UTC') + interval '7 days'
FROM "user" AS u
WHERE p."user_id" = u."id"
	AND p."status_assinatura" IS NULL;
--> statement-breakpoint
INSERT INTO "perfis" ("user_id", "status_assinatura", "status_assinatura_desde", "trial_ate")
SELECT
	u."id",
	CASE
		WHEN (u."created_at" AT TIME ZONE 'UTC') + interval '7 days' > now()
			THEN 'trial'::"public"."status_assinatura"
		ELSE 'expirada'::"public"."status_assinatura"
	END,
	u."created_at" AT TIME ZONE 'UTC',
	(u."created_at" AT TIME ZONE 'UTC') + interval '7 days'
FROM "user" AS u
WHERE NOT EXISTS (
	SELECT 1 FROM "perfis" AS p WHERE p."user_id" = u."id"
)
ON CONFLICT ("user_id") DO NOTHING;
