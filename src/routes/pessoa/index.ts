import express from 'express';
import { PrismaClient, Prisma, Role } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Listar todas as pessoas
router.get('/pessoa', async (req, res) => {
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
    } catch (err: any) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar pessoas',
            error: err.message,
        });
    }
});

// Listar pessoa por ID
router.get('/pessoa/:id', async (req, res) => {
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
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            return res.status(404).json({
                status: 'error',
                message: 'Pessoa não encontrada',
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar pessoa',
            error: err.message,
        });
    }
});

// Atualizar role de uma pessoa
router.patch('/pessoa/:id/role', async (req, res) => {
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
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            return res.status(404).json({
                status: 'error',
                message: 'Pessoa não encontrada',
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar role da pessoa',
            error: err.message,
        });
    }
});

// Listar prestadores de serviço
router.get('/prestadores', async (req, res) => {
    try {
        const prestadores = await prisma.pessoa.findMany({
            where: { role: 'PRESTADOR' },
            include: { servicosOferecidos: true },
        });

        res.status(200).json({
            status: 'success',
            data: prestadores,
        });
    } catch (err: any) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar prestadores de serviço',
            error: err.message,
        });
    }
});

// Listar clientes
router.get('/clientes', async (req, res) => {
    try {
        const clientes = await prisma.pessoa.findMany({
            where: { role: 'CLIENTE' },
            include: { agendamentos: true },
        });

        res.status(200).json({
            status: 'success',
            data: clientes,
        });
    } catch (err: any) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar clientes',
            error: err.message,
        });
    }
});

export default router;
