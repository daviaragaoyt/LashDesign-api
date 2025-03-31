import express from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Listar todos os agendamentos
router.get('/agendamento', async (req, res: any) => {
    try {
        const agendamentos = await prisma.agendamento.findMany({
            include: {
                cliente: true,
                servico: true,
            },
        });

        res.status(200).json({
            status: 'success',
            data: agendamentos,
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar agendamentos',

        });
    }
});

// Listar agendamento por ID
router.get('/agendamento/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const agendamento = await prisma.agendamento.findUnique({
            where: { id: parseInt(id) },
            include: {
                cliente: true,
                servico: true,
            },
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
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar agendamento',

        });
    }
});

// Criar um agendamento
router.post('/agendamento', async (req, res: any) => {
    try {
        const newAgendamento = req.body;
        if (!newAgendamento.dataHora || !newAgendamento.clienteId || !newAgendamento.servicoId) {
            return res.status(400).json({
                status: 'error',
                message: 'Data/hora, ID do cliente e ID do serviço são obrigatórios',
            });
        }

        const dataHoraAgendamento = new Date(newAgendamento.dataHora);
        if (isNaN(dataHoraAgendamento.getTime())) {
            return res.status(400).json({
                status: 'error',
                message: 'Data/hora inválida.',
            });
        }

        if (dataHoraAgendamento < new Date()) {
            return res.status(400).json({
                status: 'error',
                message: 'A data/hora do agendamento já passou.',
            });
        }

        const agendamentoCriado = await prisma.agendamento.create({
            data: {
                dataHora: dataHoraAgendamento,
                disponivel: false,
                clienteId: parseInt(newAgendamento.clienteId),
                servicoId: parseInt(newAgendamento.servicoId),
            },
        });

        res.status(201).json({
            status: 'success',
            data: agendamentoCriado,
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao criar agendamento',

        });
    }
});

// Atualizar um agendamento
router.put('/agendamento/:id', async (req, res: any) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const agendamentoExistente = await prisma.agendamento.findUnique({ where: { id: parseInt(id) } });

        if (!agendamentoExistente) {
            return res.status(404).json({ status: 'error', message: 'Agendamento não encontrado' });
        }

        let dataHoraFormatada = updatedData.dataHora ? new Date(updatedData.dataHora) : null;
        if (dataHoraFormatada && isNaN(dataHoraFormatada.getTime())) {
            return res.status(400).json({
                status: 'error',
                message: 'Data/hora inválida.',
            });
        }

        if (dataHoraFormatada && dataHoraFormatada < new Date()) {
            return res.status(400).json({
                status: 'error',
                message: 'A data/hora do agendamento já passou.',
            });
        }

        const agendamentoAtualizado = await prisma.agendamento.update({
            where: { id: parseInt(id) },
            data: {
                dataHora: dataHoraFormatada || agendamentoExistente.dataHora,
                clienteId: parseInt(updatedData.clienteId) || agendamentoExistente.clienteId,
                servicoId: parseInt(updatedData.servicoId) || agendamentoExistente.servicoId,
                disponivel: updatedData.disponivel !== undefined ? updatedData.disponivel : agendamentoExistente.disponivel,
            },
        });

        res.status(200).json({ status: 'success', data: agendamentoAtualizado });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Erro ao atualizar agendamento' });
    }
});

// Deletar um agendamento
router.delete('/agendamento/:id', async (req, res: any) => {
    try {
        const { id } = req.params;
        const agendamentoExistente = await prisma.agendamento.findUnique({ where: { id: parseInt(id) } });

        if (!agendamentoExistente) {
            return res.status(404).json({ status: 'error', message: 'Agendamento não encontrado' });
        }

        await prisma.agendamento.delete({ where: { id: parseInt(id) } });

        res.status(200).json({ status: 'success', message: 'Agendamento deletado com sucesso' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Erro ao deletar agendamento' });
    }
});

export default router;
