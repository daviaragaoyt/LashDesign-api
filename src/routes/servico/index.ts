import express from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// Listar todos os serviços
router.get('/servico', async (req, res: any) => {
    try {
        const servicos = await prisma.servico.findMany({
            include: {
                prestador: true,
                Agendamento: true,
            },
        });

        res.status(200).json({
            status: 'success',
            data: servicos.map(s => ({
                ...s,
                imagem: s.imagem ? '[base64_image]' : null
            })),
        });
    } catch (err: any) {
        console.error('Erro ao buscar serviços:', err);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar serviços',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
});

// Listar serviço por ID
router.get('/servico/:id', async (req, res: any) => {
    try {
        const { id } = req.params;

        const servico = await prisma.servico.findUnique({
            where: { id: parseInt(id) },
            include: {
                prestador: true,
                Agendamento: true,
            },
        });

        if (!servico) {
            return res.status(404).json({
                status: 'error',
                message: 'Serviço não encontrado',
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                ...servico,
                imagem: servico.imagem ? '[base64_image]' : null
            },
        });
    } catch (err: any) {
        console.error('Erro ao buscar serviço:', err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Serviço não encontrado',
                });
            }
        }

        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar serviço',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
});

// Criar um novo serviço
router.post('/servico', async (req, res: any) => {
    try {
        const { nome, descricao, preco, duracao, imagem, prestadorId } = req.body;

        // Validações
        if (!nome || typeof preco === 'undefined' || typeof duracao === 'undefined' || !prestadorId) {
            return res.status(400).json({
                status: 'error',
                message: 'Dados incompletos',
                required: ['nome', 'preco', 'duracao', 'prestadorId']
            });
        }

        if (imagem && imagem.length > MAX_IMAGE_SIZE) {
            return res.status(413).json({
                status: 'error',
                message: 'Imagem muito grande (máximo 2MB)',
                maxSize: MAX_IMAGE_SIZE
            });
        }

        const servico = await prisma.servico.create({
            data: {
                nome,
                descricao: descricao || null,
                preco: Number(preco),
                duracao: Number(duracao),
                imagem: imagem || null,
                prestadorId: Number(prestadorId),
            },
        });

        res.status(201).json({
            status: 'success',
            data: {
                ...servico,
                imagem: servico.imagem ? '[base64_image]' : null
            },
        });
    } catch (err: any) {
        console.error('Erro ao criar serviço:', err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2002') {
                return res.status(409).json({
                    status: 'error',
                    message: 'Serviço já existe',
                });
            }
            if (err.code === 'P2003') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Prestador não encontrado',
                });
            }
        }

        res.status(500).json({
            status: 'error',
            message: 'Erro ao criar serviço',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
});

// Atualizar um serviço existente
router.put('/servico/:id', async (req, res: any) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, duracao, imagem, prestadorId } = req.body;

        const servicoExistente = await prisma.servico.findUnique({
            where: { id: parseInt(id) },
        });

        if (!servicoExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Serviço não encontrado',
            });
        }

        if (imagem && imagem.length > MAX_IMAGE_SIZE) {
            return res.status(413).json({
                status: 'error',
                message: 'Imagem muito grande (máximo 2MB)',
                maxSize: MAX_IMAGE_SIZE
            });
        }

        const servicoAtualizado = await prisma.servico.update({
            where: { id: parseInt(id) },
            data: {
                nome: nome || servicoExistente.nome,
                descricao: descricao ?? servicoExistente.descricao,
                imagem: imagem ?? servicoExistente.imagem,
                preco: preco ? Number(preco) : servicoExistente.preco,
                duracao: duracao ? Number(duracao) : servicoExistente.duracao,
                prestadorId: prestadorId ? Number(prestadorId) : servicoExistente.prestadorId,
            },
        });

        res.status(200).json({
            status: 'success',
            data: {
                ...servicoAtualizado,
                imagem: servicoAtualizado.imagem ? '[base64_image]' : null
            },
        });
    } catch (err: any) {
        console.error('Erro ao atualizar serviço:', err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Serviço não encontrado',
                });
            }
        }

        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar serviço',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
});

// Deletar um serviço
router.delete('/servico/:id', async (req, res: any) => {
    try {
        const { id } = req.params;

        const servicoExistente = await prisma.servico.findUnique({
            where: { id: parseInt(id) },
        });

        if (!servicoExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Serviço não encontrado',
            });
        }

        await prisma.servico.delete({
            where: { id: parseInt(id) },
        });

        res.status(200).json({
            status: 'success',
            message: 'Serviço deletado com sucesso',
        });
    } catch (err: any) {
        console.error('Erro ao deletar serviço:', err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Serviço não encontrado',
                });
            }
        }

        res.status(500).json({
            status: 'error',
            message: 'Erro ao deletar serviço',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
});

export default router;