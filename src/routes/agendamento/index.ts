import express from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import moment from 'moment-timezone';
const timezone = 'America/Sao_Paulo';

const prisma = new PrismaClient();
const router = express.Router();

// Listar todos os agendamentos
router.get('/agendamento', async (req: any, res: any) => {
    try {
        const agendamentos = await prisma.agendamento.findMany({
            include: {
                cliente: true, // Inclui informações do cliente
                servico: true, // Inclui informações do serviço
            },
        });

        res.status(200).json({
            status: 'success',
            data: agendamentos,
        });
    } catch (err: any) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar agendamentos',
            error: err.message,
        });
    }
});

// Listar agendamento por ID
router.get('/agendamento/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;

        // Busca o agendamento no banco de dados
        const agendamento = await prisma.agendamento.findUnique({
            where: {
                id: parseInt(id),
            },
            include: {
                cliente: true, // Inclui informações do cliente
                servico: true, // Inclui informações do serviço
            },
        });

        // Verifica se o agendamento foi encontrado
        if (!agendamento) {
            return res.status(404).json({
                status: 'error',
                message: 'Agendamento não encontrado',
            });
        }

        // Retorna o agendamento encontrado
        res.status(200).json({
            status: 'success',
            data: agendamento,
        });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Agendamento não encontrado',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar agendamento',
            error: err.message,
        });
    }
});

router.post('/agendamento', async (req: any, res: any) => {
    try {
        const newAgendamento = req.body;

        // Validação básica dos campos obrigatórios
        if (!newAgendamento.dataHora || !newAgendamento.clienteId || !newAgendamento.servicoId) {
            return res.status(400).json({
                status: 'error',
                message: 'Data/hora, ID do cliente e ID do serviço são obrigatórios',
            });
        }

        // Formata a data/hora no horário de Brasília
        const dataHoraAgendamento = moment.tz(newAgendamento.dataHora, 'DD/MM/YYYY:HH:mm', timezone);

        // Verifica se a data/hora é válida
        if (!dataHoraAgendamento.isValid()) {
            return res.status(400).json({
                status: 'error',
                message: 'Data/hora inválida. Use o formato "DD/MM/YYYY:HH:mm" (ex: "25/10/2025:17:30").',
            });
        }

        // Verifica se a data/hora do agendamento já passou
        const dataHoraAtual = moment().tz(timezone);
        if (dataHoraAgendamento.isBefore(dataHoraAtual)) {
            return res.status(400).json({
                status: 'error',
                message: 'A data/hora do agendamento já passou.',
            });
        }

        // Cria o agendamento no banco de dados
        const agendamentoCriado = await prisma.agendamento.create({
            data: {
                dataHora: dataHoraAgendamento.toDate(),
                disponivel: false, // Define como false, pois o horário estará ocupado
                clienteId: parseInt(newAgendamento.clienteId),
                servicoId: parseInt(newAgendamento.servicoId),
            },
        });

        res.status(201).json({
            status: 'success',
            data: agendamentoCriado,
        });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2002') {
                return res.status(409).json({
                    status: 'error',
                    message: 'Agendamento já existe',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao criar agendamento',
            error: err.message,
        });
    }
});

router.put('/agendamento/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Verifica se o agendamento existe
        const agendamentoExistente = await prisma.agendamento.findUnique({
            where: { id: parseInt(id) },
        });

        if (!agendamentoExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Agendamento não encontrado',
            });
        }

        // Formata a data/hora no horário de Brasília, se fornecida
        let dataHoraFormatada;
        if (updatedData.dataHora) {
            dataHoraFormatada = moment.tz(updatedData.dataHora, 'DD/MM/YYYY:HH:mm', timezone);

            // Verifica se a data/hora é válida
            if (!dataHoraFormatada.isValid()) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data/hora inválida. Use o formato "DD/MM/YYYY:HH:mm" (ex: "25/10/2025:17:30").',
                });
            }

            // Verifica se a data/hora do agendamento já passou
            const dataHoraAtual = moment().tz(timezone);
            if (dataHoraFormatada.isBefore(dataHoraAtual)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'A data/hora do agendamento já passou.',
                });
            }
        }

        // Atualiza o agendamento no banco de dados
        const agendamentoAtualizado = await prisma.agendamento.update({
            where: { id: parseInt(id) },
            data: {
                dataHora: dataHoraFormatada ? dataHoraFormatada.toDate() : agendamentoExistente.dataHora,
                clienteId: parseInt(updatedData.clienteId) || agendamentoExistente.clienteId,
                servicoId: parseInt(updatedData.servicoId) || agendamentoExistente.servicoId,
                disponivel: updatedData.disponivel !== undefined ? updatedData.disponivel : agendamentoExistente.disponivel,
            },
        });

        res.status(200).json({
            status: 'success',
            data: agendamentoAtualizado,
        });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Agendamento não encontrado',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar agendamento',
            error: err.message,
        });
    }
});


// Deletar um agendamento
router.delete('/agendamento/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;

        // Verifica se o agendamento existe
        const agendamentoExistente = await prisma.agendamento.findUnique({
            where: { id: parseInt(id) },
        });

        if (!agendamentoExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Agendamento não encontrado',
            });
        }

        // Deleta o agendamento do banco de dados
        await prisma.agendamento.delete({
            where: { id: parseInt(id) },
        });

        res.status(200).json({
            status: 'success',
            message: 'Agendamento deletado com sucesso',
        });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Agendamento não encontrado',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao deletar agendamento',
            error: err.message,
        });
    }
});
export default router;