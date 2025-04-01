import express from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Middleware para validação de IDs
const validateId = (req: any, res: any, next: any) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({
            status: 'error',
            message: 'ID deve ser um número válido'
        });
    }
    next();
};

// Listar todos os agendamentos com filtros opcionais
router.get('/agendamento', async (req, res: any) => {
    try {
        const { clienteId, servicoId, dataInicio, dataFim } = req.query;

        const where: any = {};

        if (clienteId) where.clienteId = parseInt(clienteId as string);
        if (servicoId) where.servicoId = parseInt(servicoId as string);

        if (dataInicio && dataFim) {
            where.dataHora = {
                gte: new Date(dataInicio as string),
                lte: new Date(dataFim as string)
            };
        }

        const agendamentos = await prisma.agendamento.findMany({
            where,
            include: {
                cliente: true,
                servico: {
                    include: {
                        prestador: true
                    }
                }
            },
            orderBy: {
                dataHora: 'asc'
            }
        });

        res.status(200).json({
            status: 'success',
            data: agendamentos,
        });
    } catch (err) {
        console.error('Erro ao buscar agendamentos:', err);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar agendamentos',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});

// Listar agendamento por ID
router.get('/agendamento/:id', validateId, async (req, res: any) => {
    try {
        const agendamento = await prisma.agendamento.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                cliente: true,
                servico: {
                    include: {
                        prestador: true
                    }
                }
            }
        });

        if (!agendamento) {
            return res.status(404).json({
                status: 'error',
                message: 'Agendamento não encontrado',
            });
        }

        res.status(200).json({
            status: 'success',
            data: agendamento,
        });
    } catch (err) {
        console.error('Erro ao buscar agendamento:', err);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar agendamento',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});

// Criar um agendamento
router.post('/agendamento', async (req, res: any) => {
    try {
        const { dataHora, clienteId, servicoId } = req.body;

        // Validações básicas
        if (!dataHora || !clienteId || !servicoId) {
            return res.status(400).json({
                status: 'error',
                message: 'Data/hora, ID do cliente e ID do serviço são obrigatórios',
            });
        }

        // Validar e formatar data
        const dataHoraAgendamento = new Date(dataHora);
        if (isNaN(dataHoraAgendamento.getTime())) {
            return res.status(400).json({
                status: 'error',
                message: 'Data/hora inválida',
            });
        }

        // Verificar se a data já passou
        if (dataHoraAgendamento < new Date()) {
            return res.status(400).json({
                status: 'error',
                message: 'Não é possível agendar para datas/horas passadas',
            });
        }

        // Verificar se o cliente existe
        const cliente = await prisma.pessoa.findUnique({
            where: { id: parseInt(clienteId) }
        });
        if (!cliente) {
            return res.status(404).json({
                status: 'error',
                message: 'Cliente não encontrado',
            });
        }

        // Verificar se o serviço existe e obter o prestador
        const servico = await prisma.servico.findUnique({
            where: { id: parseInt(servicoId) },
            include: { prestador: true }
        });
        if (!servico) {
            return res.status(404).json({
                status: 'error',
                message: 'Serviço não encontrado',
            });
        }

        // Verificar conflitos de agendamento
        const conflito = await prisma.agendamento.findFirst({
            where: {
                servico: {
                    prestadorId: servico.prestadorId
                },
                dataHora: dataHoraAgendamento
            }
        });

        if (conflito) {
            return res.status(409).json({
                status: 'error',
                message: 'Já existe um agendamento para este prestador no mesmo horário',
            });
        }

        // Criar o agendamento
        const agendamentoCriado = await prisma.agendamento.create({
            data: {
                dataHora: dataHoraAgendamento,

                clienteId: parseInt(clienteId),
                servicoId: parseInt(servicoId),

            },
            include: {
                cliente: true,
                servico: true
            }
        });

        res.status(201).json({
            status: 'success',
            data: agendamentoCriado,
        });
    } catch (err) {
        console.error('Erro ao criar agendamento:', err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2002') {
                return res.status(409).json({
                    status: 'error',
                    message: 'Conflito de agendamento',
                });
            }
            if (err.code === 'P2003') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Referência inválida (cliente ou serviço não existe)',
                });
            }
        }

        res.status(500).json({
            status: 'error',
            message: 'Erro ao criar agendamento',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});

// Atualizar um agendamento
router.put('/agendamento/:id', validateId, async (req, res: any) => {
    try {
        const { id } = req.params;
        const { dataHora, clienteId, servicoId, status } = req.body;

        // Verificar se o agendamento existe
        const agendamentoExistente = await prisma.agendamento.findUnique({
            where: { id: parseInt(id) },
            include: { servico: true }
        });

        if (!agendamentoExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Agendamento não encontrado',
            });
        }

        // Preparar dados para atualização
        const updateData: any = {};

        if (dataHora) {
            const novaDataHora = new Date(dataHora);
            if (isNaN(novaDataHora.getTime())) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data/hora inválida',
                });
            }
            if (novaDataHora < new Date()) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Não é possível agendar para datas/horas passadas',
                });
            }
            updateData.dataHora = novaDataHora;
        }

        if (clienteId) {
            const cliente = await prisma.pessoa.findUnique({
                where: { id: parseInt(clienteId) }
            });
            if (!cliente) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Cliente não encontrado',
                });
            }
            updateData.clienteId = parseInt(clienteId);
        }

        if (servicoId) {
            const servico = await prisma.servico.findUnique({
                where: { id: parseInt(servicoId) }
            });
            if (!servico) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Serviço não encontrado',
                });
            }
            updateData.servicoId = parseInt(servicoId);
            updateData.prestadorId = servico.prestadorId;
        }

        if (status) {
            updateData.status = status;
        }

        // Verificar conflitos de agendamento se a data foi alterada
        if (updateData.dataHora) {
            const conflito = await prisma.agendamento.findFirst({
                where: {
                    NOT: { id: parseInt(id) },

                    dataHora: updateData.dataHora
                }
            });

            if (conflito) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Já existe um agendamento para este prestador no mesmo horário',
                });
            }
        }

        // Atualizar o agendamento
        const agendamentoAtualizado = await prisma.agendamento.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                cliente: true,
                servico: true
            }
        });

        res.status(200).json({
            status: 'success',
            data: agendamentoAtualizado,
        });
    } catch (err) {
        console.error('Erro ao atualizar agendamento:', err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2002') {
                return res.status(409).json({
                    status: 'error',
                    message: 'Conflito de agendamento',
                });
            }
        }

        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar agendamento',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});

// Deletar um agendamento
router.delete('/agendamento/:id', validateId, async (req, res: any) => {
    try {
        const { id } = req.params;

        // Verificar se o agendamento existe
        const agendamentoExistente = await prisma.agendamento.findUnique({
            where: { id: parseInt(id) }
        });

        if (!agendamentoExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Agendamento não encontrado',
            });
        }

        // Verificar se o agendamento já passou
        if (agendamentoExistente.dataHora < new Date()) {
            return res.status(400).json({
                status: 'error',
                message: 'Não é possível cancelar agendamentos passados',
            });
        }

        await prisma.agendamento.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({
            status: 'success',
            message: 'Agendamento cancelado com sucesso',
        });
    } catch (err) {
        console.error('Erro ao deletar agendamento:', err);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao deletar agendamento',
            error: process.env.NODE_ENV === 'development' ? err : undefined
        });
    }
});

export default router;