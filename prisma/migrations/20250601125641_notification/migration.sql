-- CreateTable
CREATE TABLE "lash_design"."notificacoes" (
    "id" SERIAL NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pessoaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "agendamentoId" INTEGER,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lash_design"."notificacoes" ADD CONSTRAINT "notificacoes_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "lash_design"."pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
