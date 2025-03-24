import express from 'express';
import { PrismaClient, Prisma, Role } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Listar todas as pessoas
router.get('/pessoa', async (req: any, res: any) => {
    try {
        const pessoas = await prisma.pessoa.findMany({
            include: {
                agendamentos: true,
                servicosOferecidos: true,
            },
        });

        res.status(200).json({
            status: 'success',
            data: pessoas,
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar pessoas',

        });
    }
});

// Listar pessoa por ID
router.get('/pessoa/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const pessoa = await prisma.pessoa.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                dataNascimento: true,
                role: true,
                endereco: true,
                agendamentos: true,
                servicosOferecidos: true,
            },
        });

        if (!pessoa) {
            return res.status(404).json({
                status: 'error',
                message: 'Pessoa não encontrada',
            });
        }

        res.status(200).json({
            status: 'success',
            data: pessoa,
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar pessoa',

        });
    }
});

// Atualizar role de uma pessoa
router.patch('/pessoa/:id/role', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['ADMIN', 'USER', 'CLIENTE', 'PRESTADOR'].includes(role)) {
            return res.status(400).json({
                status: 'error',
                message: 'Role inválida',
            });
        }

        const pessoaExistente = await prisma.pessoa.findUnique({
            where: { id: parseInt(id) },
        });

        if (!pessoaExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Pessoa não encontrada',
            });
        }

        const pessoaAtualizada = await prisma.pessoa.update({
            where: { id: parseInt(id) },
            data: { role: role as Role },
        });

        res.status(200).json({
            status: 'success',
            data: pessoaAtualizada,
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar role',

        });
    }
});

export default router;
