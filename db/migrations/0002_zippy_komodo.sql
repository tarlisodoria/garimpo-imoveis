CREATE TABLE "filtros" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"uf" varchar(2) NOT NULL,
	"cidades" text[] DEFAULT '{}' NOT NULL,
	"tipos" text[] DEFAULT '{}' NOT NULL,
	"preco_max" numeric(14, 2),
	"desconto_min" numeric(5, 2),
	"aceita_financiamento" boolean,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perfis" (
	"user_id" text PRIMARY KEY NOT NULL,
	"plano" text,
	"status_assinatura" text,
	"trial_ate" timestamp with time zone,
	"asaas_customer_id" text,
	"asaas_subscription_id" text,
	"telegram_chat_id" text,
	"alerta_email" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "filtros" ADD CONSTRAINT "filtros_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfis" ADD CONSTRAINT "perfis_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "filtros_user_id_idx" ON "filtros" USING btree ("user_id");