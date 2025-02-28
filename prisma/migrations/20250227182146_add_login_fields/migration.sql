-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "lash_design";

-- CreateEnum
CREATE TYPE "lash_design"."Role" AS ENUM ('ADMIN', 'USER', 'CLIENTE', 'PRESTADOR');

-- CreateTable
CREATE TABLE "lash_design"."pessoas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "senha" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3),
    "endereco" TEXT,
    "role" "lash_design"."Role" NOT NULL DEFAULT 'CLIENTE',

    CONSTRAINT "pessoas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lash_design"."servicos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DOUBLE PRECISION NOT NULL,
    "duracao" INTEGER NOT NULL,
    "prestadorId" INTEGER NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lash_design"."agendamentos" (
    "id" SERIAL NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "servicoId" INTEGER NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_email_key" ON "lash_design"."pessoas"("email");

-- AddForeignKey
ALTER TABLE "lash_design"."servicos" ADD CONSTRAINT "servicos_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "lash_design"."pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lash_design"."agendamentos" ADD CONSTRAINT "agendamentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "lash_design"."pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lash_design"."agendamentos" ADD CONSTRAINT "agendamentos_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "lash_design"."servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
