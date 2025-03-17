import express from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Listar todos os serviços
router.get('/servico', async (req: any, res: any) => {
    try {
        const servicos = await prisma.servico.findMany({
            include: {
                prestador: true, // Inclui informações do prestador de serviço
                Agendamento: true, // Inclui informações dos agendamentos associados
            },
        });

        res.status(200).json({
            status: 'success',
            data: servicos,
        });
    } catch (err: any) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar serviços',
            error: err.message,
        });
    }
});

// Listar serviço por ID
router.get('/servico/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;

        // Busca o serviço no banco de dados
        const servico = await prisma.servico.findUnique({
            where: {
                id: parseInt(id),
            },
            include: {
                prestador: true, // Inclui informações do prestador de serviço
                Agendamento: true, // Inclui informações dos agendamentos associados
            },
        });

        // Verifica se o serviço foi encontrado
        if (!servico) {
            return res.status(404).json({
                status: 'error',
                message: 'Serviço não encontrado',
            });
        }

        // Retorna o serviço encontrado
        res.status(200).json({
            status: 'success',
            data: servico,
        });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Serviço não encontrado',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar serviço',
            error: err.message,
        });
    }
});

// Criar um novo serviço
router.post('/servico', async (req: any, res: any) => {
    try {
        const newServico = req.body;

        // Validação básica dos campos obrigatórios
        if (!newServico.nome || !newServico.preco || !newServico.duracao || !newServico.prestadorId) {
            return res.status(400).json({
                status: 'error',
                message: 'Nome, preço, duração e ID do prestador são obrigatórios',
            });
        }

        // Cria o serviço no banco de dados
        const servicoCriado = await prisma.servico.create({
            data: {
                nome: newServico.nome,
                descricao: newServico.descricao || null, // Descrição é opcional
                imagem: newServico.imagem || null,
                preco: parseFloat(newServico.preco), // Converte para número
                duracao: parseInt(newServico.duracao), // Converte para número
                prestadorId: parseInt(newServico.prestadorId), // Converte para número
            },
        });

        res.status(201).json({
            status: 'success',
            data: servicoCriado,
        });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2002') {
                return res.status(409).json({
                    status: 'error',
                    message: 'Serviço já existe',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao criar serviço',
            error: err.message,
        });
    }
});

// Atualizar um serviço existente
router.put('/servico/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Verifica se o serviço existe
        const servicoExistente = await prisma.servico.findUnique({
            where: { id: parseInt(id) },
        });

        if (!servicoExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Serviço não encontrado',
            });
        }

        // Atualiza o serviço no banco de dados
        const servicoAtualizado = await prisma.servico.update({
            where: { id: parseInt(id) },
            data: {
                nome: updatedData.nome || servicoExistente.nome,
                descricao: updatedData.descricao || servicoExistente.descricao,
                imagem: updatedData.imagem || servicoExistente.imagem,
                preco: parseFloat(updatedData.preco) || servicoExistente.preco,
                duracao: parseInt(updatedData.duracao) || servicoExistente.duracao,
                prestadorId: parseInt(updatedData.prestadorId) || servicoExistente.prestadorId,
            },
        });

        res.status(200).json({
            status: 'success',
            data: servicoAtualizado,
        });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Serviço não encontrado',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar serviço',
            error: err.message,
        });
    }
});

// Deletar um serviço
router.delete('/servico/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;

        // Verifica se o serviço existe
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
            where: { id: Number(id) },
        });

        res.status(200).json({
            status: 'success',
            message: 'Serviço deletado com sucesso',
        });
    } catch (err: any) {
        console.log("Entrou no catch", err)
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Serviço não encontrado',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao deletar serviço',
            error: err.message,
        });

    }
});

export default router;