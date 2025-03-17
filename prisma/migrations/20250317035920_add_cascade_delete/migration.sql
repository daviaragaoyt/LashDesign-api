-- DropForeignKey
ALTER TABLE "lash_design"."agendamentos" DROP CONSTRAINT "agendamentos_servicoId_fkey";

-- AddForeignKey
ALTER TABLE "lash_design"."agendamentos" ADD CONSTRAINT "agendamentos_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "lash_design"."servicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
