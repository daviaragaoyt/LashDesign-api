import { PrismaClient, TipoNotificacao } from '@prisma/client';

const prisma = new PrismaClient();

// Interface atualizada para corresponder ao novo schema
interface NotificacaoData {
    destinatarioId: number;
    tipo: TipoNotificacao;
    mensagem: string;
    remetenteId?: number;
    agendamentoId?: number;
}

/**
 * Cria uma nova notificação no banco de dados.
 */
export const criarNotificacao = async (data: NotificacaoData): Promise<void> => {
    try {
        await prisma.notificacao.create({
            data: {
                destinatarioId: data.destinatarioId,
                tipo: data.tipo,
                mensagem: data.mensagem,
                remetenteId: data.remetenteId,
                agendamentoId: data.agendamentoId,
            },
        });
        console.log(`Notificação do tipo ${data.tipo} criada para o usuário ${data.destinatarioId}.`);
    } catch (error) {
        console.error('Falha ao criar notificação:', error);
    }
};