import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = express.Router();
// Listar todas as notificações de um usuário (ele é o destinatário)
router.get('/notificacoes/usuario/:usuarioId', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const notificacoes = await prisma.notificacao.findMany({
            where: {
                destinatarioId: parseInt(usuarioId), // Busca pelo destinatário
            },
            orderBy: { dataCriacao: 'desc' },
            include: {
                remetente: { // Inclui dados de quem enviou a notificação
                    select: { id: true, nome: true }
                }
            }
        });
        res.status(200).json({ status: 'success', data: notificacoes });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Erro ao buscar notificações.' });
    }
});

// As outras rotas (ler, ler-todas) continuam funcionando como antes.
// ...