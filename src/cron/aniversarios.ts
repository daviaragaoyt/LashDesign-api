import cron from 'node-cron';
import { PrismaClient, Prisma, TipoNotificacao } from '@prisma/client';
import { criarNotificacao } from '../services/notificacaoService'; // Ajuste o caminho

const prisma = new PrismaClient();

const checarAniversarios = async () => {
    console.log('Rodando tarefa agendada: Verificação de aniversários...');
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mesHoje = hoje.getMonth() + 1;

    try {
        // 1. Encontrar todos os clientes fazendo aniversário hoje.
        // Adicionamos a verificação de dataNascimento não ser nulo.
        const aniversariantes = await prisma.pessoa.findMany({
            where: {
                role: 'CLIENTE',
                dataNascimento: {
                    not: null, // Garante que só peguemos pessoas com data cadastrada
                },
                // Usamos Prisma.sql para criar uma query raw que funciona no PostgreSQL
                // para extrair mês e dia, ignorando o ano.
                AND: [
                    {
                        // Prisma does not support extracting month/day directly, so we use string operations
                        // Assumes dataNascimento is stored as a Date
                        // This filter works for PostgreSQL; adjust if using another DB
                        // Use raw query if this does not work as expected
                        dataNascimento: {
                            gte: new Date(hoje.getFullYear(), mesHoje - 1, diaHoje, 0, 0, 0),
                            lt: new Date(hoje.getFullYear(), mesHoje - 1, diaHoje + 1, 0, 0, 0),
                        }
                    }
                ],
            },
        });

        if (aniversariantes.length === 0) {
            console.log('Nenhum aniversariante hoje.');
            return;
        }

        console.log(`Encontrados ${aniversariantes.length} aniversariantes hoje.`);

        // 2. Para cada aniversariante, encontrar os prestadores que já o atenderam
        for (const cliente of aniversariantes) {
            const agendamentos = await prisma.agendamento.findMany({
                where: { clienteId: cliente.id },
                distinct: ['servicoId'], // Pega apenas um agendamento por serviço
                include: { servico: true },
            });

            // Usamos um Set para notificar cada prestador apenas uma vez, mesmo que
            // ele tenha prestado múltiplos serviços diferentes para o mesmo cliente.
            const prestadoresIds = new Set(agendamentos.map(ag => ag.servico.prestadorId));

            // 3. Criar a notificação para cada prestador relevante
            for (const prestadorId of prestadoresIds) {
                const mensagem = `Lembrete: Hoje é aniversário de seu cliente ${cliente.nome}! Que tal enviar uma felicitação?`;
                await criarNotificacao({
                    destinatarioId: prestadorId,
                    remetenteId: cliente.id, // O "remetente" aqui é o sujeito da notificação
                    tipo: TipoNotificacao.LEMBRETE_ANIVERSARIO, // Usando o Enum
                    mensagem,
                });
            }
        }
    } catch (error) {
        console.error('Erro na tarefa de verificação de aniversários:', error);
    }
};

export const initCronJobs = () => {
    cron.schedule('0 8 * * *', checarAniversarios, {
        timezone: "America/Sao_Paulo"
    });
    console.log('-> Tarefa de lembrete de aniversário agendada para 08:00 (America/Sao_Paulo).');
};