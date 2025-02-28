import express from 'express';
import { PrismaClient, Prisma, Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const router = express.Router();

// Configurações do JWT
const JWT_SECRET = 'sua_chave_secreta_aqui'; // Use uma chave segura em produção
const JWT_ACCESS_EXPIRES_IN = '15m'; // Tempo de expiração do access token
const JWT_REFRESH_EXPIRES_IN = '7d'; // Tempo de expiração do refresh token

// Lista negra de tokens
const tokenBlacklist: string[] = [];

// Middleware de autenticação
const autenticar = (req: any, res: any, next: any) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Token de autenticação não fornecido',
        });
    }

    // Verifica se o token está na lista negra
    if (tokenBlacklist.includes(token)) {
        return res.status(401).json({
            status: 'error',
            message: 'Token inválido (logout realizado)',
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: Role };
        req.usuario = decoded; // Adiciona as informações do usuário à requisição
        next();
    } catch (err) {
        res.status(401).json({
            status: 'error',
            message: 'Token inválido ou expirado',
        });
    }
};

// Rota de login
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

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Email inválido',
            });
        }

        // Busca a pessoa no banco de dados
        const pessoa = await prisma.pessoa.findUnique({
            where: { email },
        });

        // Verifica se a pessoa existe
        if (!pessoa) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuário não encontrado',
            });
        }

        // Compara a senha fornecida com a senha armazenada (criptografada)
        const senhaValida = await bcrypt.compare(senha, pessoa.senha);

        if (!senhaValida) {
            return res.status(401).json({
                status: 'error',
                message: 'Senha incorreta',
            });
        }

        // Gera o access token
        const accessToken = jwt.sign(
            { id: pessoa.id, email: pessoa.email, role: pessoa.role },
            JWT_SECRET,
            { expiresIn: JWT_ACCESS_EXPIRES_IN }
        );

        // Gera o refresh token
        const refreshToken = jwt.sign(
            { id: pessoa.id },
            JWT_SECRET,
            { expiresIn: JWT_REFRESH_EXPIRES_IN }
        );

        // Armazena o refresh token no banco de dados
        await prisma.pessoa.update({
            where: { id: pessoa.id },
            data: { refreshToken },
        });

        // Log de login bem-sucedido
        console.log(`Usuário ${pessoa.email} fez login em ${new Date().toISOString()}`);

        // Retorna os tokens e informações do usuário
        res.status(200).json({
            status: 'success',
            data: {
                accessToken,
                refreshToken,
                pessoa: {
                    id: pessoa.id,
                    nome: pessoa.nome,
                    email: pessoa.email,
                    role: pessoa.role,
                },
            },
        });
    } catch (err: any) {
        // Log de erro
        console.error(`Erro ao fazer login: ${err.message}`);

        res.status(500).json({
            status: 'error',
            message: 'Erro ao fazer login',
            error: err.message,
        });
    }
});

// Rota de logout
router.post('/logout', autenticar, (req: any, res: any) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            tokenBlacklist.push(token); // Adiciona o token à lista negra
        }

        // Log de logout
        console.log(`Usuário ${req.usuario.email} fez logout em ${new Date().toISOString()}`);

        res.status(200).json({
            status: 'success',
            message: 'Logout realizado com sucesso',
        });
    } catch (err: any) {
        // Log de erro
        console.error(`Erro ao fazer logout: ${err.message}`);

        res.status(500).json({
            status: 'error',
            message: 'Erro ao fazer logout',
            error: err.message,
        });
    }
});

// Rota para gerar um novo access token usando o refresh token
router.post('/refresh-token', async (req: any, res: any) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                status: 'error',
                message: 'Refresh token é obrigatório',
            });
        }

        // Verifica se o refresh token é válido
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: number };

        // Busca a pessoa no banco de dados
        const pessoa = await prisma.pessoa.findUnique({
            where: { id: decoded.id },
        });

        if (!pessoa || pessoa.refreshToken !== refreshToken) {
            return res.status(401).json({
                status: 'error',
                message: 'Refresh token inválido',
            });
        }

        // Gera um novo access token
        const accessToken = jwt.sign(
            { id: pessoa.id, email: pessoa.email, role: pessoa.role },
            JWT_SECRET,
            { expiresIn: JWT_ACCESS_EXPIRES_IN }
        );

        res.status(200).json({
            status: 'success',
            data: {
                accessToken,
            },
        });
    } catch (err: any) {
        // Log de erro
        console.error(`Erro ao gerar novo access token: ${err.message}`);

        res.status(500).json({
            status: 'error',
            message: 'Erro ao gerar novo access token',
            error: err.message,
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
        const newPessoa = req.body;

        // Validação básica dos campos obrigatórios
        if (!newPessoa.nome || !newPessoa.dataNascimento) {
            return res.status(400).json({
                status: 'error',
                message: 'Nome e data de nascimento são obrigatórios',
            });
        }

        // Formata a data de nascimento
        const [dia, mes, ano] = newPessoa.dataNascimento.split('/');
        const dataFormatada = new Date(`${ano}-${mes}-${dia}`);

        // Criptografa a senha
        const senhaCriptografada = await bcrypt.hash(newPessoa.senha, 10);

        // Cria a pessoa no banco de dados
        const pessoaCriada = await prisma.pessoa.create({
            data: {
                nome: newPessoa.nome,
                dataNascimento: dataFormatada,
                email: newPessoa.email,
                endereco: newPessoa.endereco,
                telefone: newPessoa.telefone,
                senha: senhaCriptografada, // Armazena a senha criptografada
                role: newPessoa.role || 'CLIENTE', // Define a role padrão como CLIENTE
            },
        });

        res.status(201).json({
            status: 'success',
            data: pessoaCriada,
        });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2002') {
                return res.status(409).json({
                    status: 'error',
                    message: 'Email já cadastrado',
                });
            }
        }

        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao criar pessoa',
            error: err.message,
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