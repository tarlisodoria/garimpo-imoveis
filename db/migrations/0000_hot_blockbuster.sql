CREATE TYPE "public"."coleta_status" AS ENUM('sucesso', 'falha', 'sem_alteracao');--> statement-breakpoint
CREATE TYPE "public"."evento_tipo" AS ENUM('novo', 'queda_preco', 'mudou_modalidade', 'saiu');--> statement-breakpoint
CREATE TABLE "coletas" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"uf" varchar(2) NOT NULL,
	"iniciado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "coleta_status" NOT NULL,
	"linhas" integer,
	"hash_arquivo" varchar(128),
	"erro" text
);
--> statement-breakpoint
CREATE TABLE "eventos" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"id_caixa" varchar(32) NOT NULL,
	"tipo" "evento_tipo" NOT NULL,
	"detalhe" jsonb NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imoveis" (
	"id_caixa" varchar(32) PRIMARY KEY NOT NULL,
	"uf" varchar(2) NOT NULL,
	"cidade" varchar(160) NOT NULL,
	"cidade_slug" varchar(180),
	"bairro" varchar(160),
	"endereco" text NOT NULL,
	"tipo" varchar(80),
	"descricao_curta" text NOT NULL,
	"preco" numeric(14, 2) NOT NULL,
	"valor_avaliacao" numeric(14, 2) NOT NULL,
	"desconto_pct" numeric(5, 2) NOT NULL,
	"modalidade" varchar(120) NOT NULL,
	"aceita_financiamento" boolean NOT NULL,
	"link_oficial" text NOT NULL,
	"primeira_vez_visto" timestamp with time zone DEFAULT now() NOT NULL,
	"ultima_vez_visto" timestamp with time zone DEFAULT now() NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imoveis_historico" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"id_caixa" varchar(32) NOT NULL,
	"data" date NOT NULL,
	"preco" numeric(14, 2) NOT NULL,
	"desconto_pct" numeric(5, 2) NOT NULL,
	"modalidade" varchar(120) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_id_caixa_imoveis_id_caixa_fk" FOREIGN KEY ("id_caixa") REFERENCES "public"."imoveis"("id_caixa") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imoveis_historico" ADD CONSTRAINT "imoveis_historico_id_caixa_imoveis_id_caixa_fk" FOREIGN KEY ("id_caixa") REFERENCES "public"."imoveis"("id_caixa") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coletas_uf_idx" ON "coletas" USING btree ("uf");--> statement-breakpoint
CREATE INDEX "coletas_iniciado_em_idx" ON "coletas" USING btree ("iniciado_em");--> statement-breakpoint
CREATE UNIQUE INDEX "coletas_uf_hash_arquivo_idx" ON "coletas" USING btree ("uf","hash_arquivo");--> statement-breakpoint
CREATE INDEX "eventos_id_caixa_idx" ON "eventos" USING btree ("id_caixa");--> statement-breakpoint
CREATE INDEX "eventos_tipo_idx" ON "eventos" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "imoveis_uf_idx" ON "imoveis" USING btree ("uf");--> statement-breakpoint
CREATE INDEX "imoveis_cidade_idx" ON "imoveis" USING btree ("cidade");--> statement-breakpoint
CREATE INDEX "imoveis_cidade_slug_idx" ON "imoveis" USING btree ("cidade_slug");--> statement-breakpoint
CREATE INDEX "imoveis_ativo_idx" ON "imoveis" USING btree ("ativo");--> statement-breakpoint
CREATE INDEX "imoveis_desconto_idx" ON "imoveis" USING btree ("desconto_pct");--> statement-breakpoint
CREATE INDEX "imoveis_historico_id_caixa_idx" ON "imoveis_historico" USING btree ("id_caixa");--> statement-breakpoint
CREATE UNIQUE INDEX "imoveis_historico_id_caixa_data_idx" ON "imoveis_historico" USING btree ("id_caixa","data");