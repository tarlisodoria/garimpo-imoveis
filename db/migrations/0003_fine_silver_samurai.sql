CREATE TABLE "alertas_enviados" (
	"user_id" text NOT NULL,
	"id_caixa" varchar(32) NOT NULL,
	"tipo_evento" "evento_tipo" NOT NULL,
	"canal" varchar(16) NOT NULL,
	"enviado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_vinculos" (
	"token" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"usado_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "perfis" ADD COLUMN "alertas_pausados" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "alertas_enviados" ADD CONSTRAINT "alertas_enviados_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_vinculos" ADD CONSTRAINT "telegram_vinculos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alertas_enviados_user_imovel_evento_canal_idx" ON "alertas_enviados" USING btree ("user_id","id_caixa","tipo_evento","canal");--> statement-breakpoint
CREATE INDEX "telegram_vinculos_user_id_idx" ON "telegram_vinculos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "telegram_vinculos_expira_em_idx" ON "telegram_vinculos" USING btree ("expira_em");--> statement-breakpoint
CREATE UNIQUE INDEX "perfis_telegram_chat_id_idx" ON "perfis" USING btree ("telegram_chat_id");