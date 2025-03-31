import express from 'express';
import { PrismaClient, Prisma, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const router = express.Router();

// Rota de login (ADICIONE ESTA ROTA)
router.post('/login', async (req: any, res: any) => {
    try {
        const { email, senha } = req.body;

        // Validação básica
        if (!email || !senha) {
            return res.status(400).json({
                status: 'error',
                message: 'Email e senha são obrigatórios',
            });
        }

        // Busca a pessoa no banco de dados
        const pessoa = await prisma.pessoa.findUnique({
            where: { email },
        });

        if (!pessoa) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuário não encontrado',
            });
        }

        // Verifica a senha
        const senhaValida = await bcrypt.compare(senha, pessoa.senha);

        if (!senhaValida) {
            return res.status(401).json({
                status: 'error',
                message: 'Senha incorreta',
            });
        }

        // Retorna as informações do usuário (sem JWT)
        res.status(200).json({
            status: 'success',
            data: {
                pessoa: {
                    id: pessoa.id,
                    nome: pessoa.nome,
                    email: pessoa.email,
                    role: pessoa.role,
                },
            },
        });
    } catch (err: any) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao fazer login',
            error: err.message,
        });
    }
});

// Adicione esta rota no seu arquivo de rotas
router.post('/logout', async (req: any, res: any) => {
    try {
        const { userId } = req.body;

        // Aqui você pode registrar o logout no banco de dados se quiser
        // Exemplo: await prisma.logAuditoria.create({...});

        res.status(200).json({
            status: 'success',
            message: 'Logout registrado com sucesso'
        });
    } catch (err: any) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao registrar logout',
            error: err.message
        });
    }
});

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
    } catch (err: any) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar pessoas',
            error: err.message,
        });
    }
});

// Listar pessoa por ID
router.get('/pessoa/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;

        // Busca a pessoa no banco de dados
        const pessoa = await prisma.pessoa.findUnique({
            where: {
                id: parseInt(id),
            },
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

        // Verifica se a pessoa foi encontrada
        if (!pessoa) {
            return res.status(404).json({
                status: 'error',
                message: 'Pessoa não encontrada',
            });
        }

        // Retorna a pessoa encontrada
        res.status(200).json({
            status: 'success',
            data: pessoa,
        });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Pessoa não encontrada',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar pessoa',
            error: err.message,
        });
    }
});

// Atualizar role de uma pessoa
router.patch('/pessoa/:id/role', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Valida se a role fornecida é válida
        if (!['ADMIN', 'USER', 'CLIENTE', 'PRESTADOR'].includes(role)) {
            return res.status(400).json({
                status: 'error',
                message: 'Role inválida',
            });
        }

        // Verifica se a pessoa existe
        const pessoaExistente = await prisma.pessoa.findUnique({
            where: { id: parseInt(id) },
        });

        if (!pessoaExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Pessoa não encontrada',
            });
        }

        // Atualiza a role da pessoa
        const pessoaAtualizada = await prisma.pessoa.update({
            where: { id: parseInt(id) },
            data: {
                role: role as Role, // Converte a string para o tipo Role
            },
        });

        res.status(200).json({
            status: 'success',
            data: pessoaAtualizada,
        });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Pessoa não encontrada',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar role da pessoa',
            error: err.message,
        });
    }
});

// Listar prestadores de serviço
router.get('/prestadores', async (req: any, res: any) => {
    try {
        const prestadores = await prisma.pessoa.findMany({
            where: {
                role: 'PRESTADOR',
            },
            include: {
                servicosOferecidos: true, // Inclui os serviços oferecidos pelo prestador
            },
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
router.get('/clientes', async (req: any, res: any) => {
    try {
        const clientes = await prisma.pessoa.findMany({
            where: {
                role: 'CLIENTE',
            },
            include: {
                agendamentos: true, // Inclui os agendamentos do cliente
            },
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

// Criar uma nova pessoa
router.post('/pessoa', async (req: any, res: any) => {
    try {
        const { nome, email, senha, dataNascimento, telefone, endereco } = req.body;

        // Validação básica dos campos obrigatórios
        if (!nome || !email || !senha || !dataNascimento) {
            return res.status(400).json({
                status: 'error',
                message: 'Nome, email, senha e data de nascimento são obrigatórios.',
            });
        }

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Email inválido.',
            });
        }

        // Converte a data para o formato adequado, se necessário
        let parsedDate: Date;
        if (dataNascimento.includes('/')) {
            const [dia, mes, ano] = dataNascimento.split('/');
            parsedDate = new Date(`${ano}-${mes}-${dia}`);
        } else {
            parsedDate = new Date(dataNascimento);
        }

        // Criptografa a senha
        const senhaCriptografada = await bcrypt.hash(senha, 10);

        // Cria a pessoa no banco de dados
        const pessoaCriada = await prisma.pessoa.create({
            data: {
                nome,
                email,
                senha: senhaCriptografada,
                dataNascimento: parsedDate, // Data formatada
                telefone: telefone || null, // Telefone é opcional
                endereco: endereco || null, // Endereço é opcional
                role: 'CLIENTE', // Define a role como CLIENTE por padrão
            },
        });

        // Retorna a pessoa criada
        res.status(201).json({
            status: 'success',
            data: pessoaCriada,
        });
    } catch (error: any) {
        if (error.code === 'P2002') { // Erro de violação de chave única (email já cadastrado)
            return res.status(409).json({
                status: 'error',
                message: 'Email já cadastrado.',
            });
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao criar pessoa.',
            error: error.message,
        });
    }
});

// Atualizar uma pessoa existente
router.put('/pessoa/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Verifica se a pessoa existe
        const pessoaExistente = await prisma.pessoa.findUnique({
            where: { id: parseInt(id) },
        });

        if (!pessoaExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Pessoa não encontrada',
            });
        }

        // Formata a data de nascimento, se fornecida
        let dataFormatada;
        if (updatedData.dataNascimento) {
            const [dia, mes, ano] = updatedData.dataNascimento.split('/');
            dataFormatada = new Date(`${ano}-${mes}-${dia}`);
        }

        // Atualiza a pessoa no banco de dados
        const pessoaAtualizada = await prisma.pessoa.update({
            where: { id: parseInt(id) },
            data: {
                nome: updatedData.nome || pessoaExistente.nome,
                dataNascimento: dataFormatada || pessoaExistente.dataNascimento,
                email: updatedData.email || pessoaExistente.email,
                endereco: updatedData.endereco || pessoaExistente.endereco,
                telefone: updatedData.telefone || pessoaExistente.telefone,
            },
        });

        res.status(200).json({
            status: 'success',
            data: pessoaAtualizada,
        });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Pessoa não encontrada',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar pessoa',
            error: err.message,
        });
    }
});

// Deletar uma pessoa
router.delete('/pessoa/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;

        // Verifica se a pessoa existe
        const pessoaExistente = await prisma.pessoa.findUnique({
            where: { id: parseInt(id) },
        });

        if (!pessoaExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Pessoa não encontrada',
            });
        }

        // Deleta a pessoa do banco de dados
        await prisma.pessoa.delete({
            where: { id: parseInt(id) },
        });

        res.status(200).json({
            status: 'success',
            message: 'Pessoa deletada com sucesso',
        });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Pessoa não encontrada',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao deletar pessoa',
            error: err.message,
        });
    }
});

export default router;