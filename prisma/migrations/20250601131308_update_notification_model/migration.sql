/*
  Warnings:

  - You are about to drop the column `pessoaId` on the `notificacoes` table. All the data in the column will be lost.
  - Added the required column `destinatarioId` to the `notificacoes` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `tipo` on the `notificacoes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "lash_design"."TipoNotificacao" AS ENUM ('AGENDAMENTO_CRIADO', 'AGENDAMENTO_CANCELADO', 'LEMBRETE_ANIVERSARIO');

-- DropForeignKey
ALTER TABLE "lash_design"."notificacoes" DROP CONSTRAINT "notificacoes_pessoaId_fkey";

-- AlterTable
ALTER TABLE "lash_design"."notificacoes" DROP COLUMN "pessoaId",
ADD COLUMN     "destinatarioId" INTEGER NOT NULL,
ADD COLUMN     "remetenteId" INTEGER,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "lash_design"."TipoNotificacao" NOT NULL;

-- AddForeignKey
ALTER TABLE "lash_design"."notificacoes" ADD CONSTRAINT "notificacoes_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "lash_design"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lash_design"."notificacoes" ADD CONSTRAINT "notificacoes_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "lash_design"."pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lash_design"."notificacoes" ADD CONSTRAINT "notificacoes_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "lash_design"."agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
