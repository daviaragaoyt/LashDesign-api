"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
// Configurações do JWT
const JWT_SECRET = 'sua_chave_secreta_aqui'; // Use uma chave segura em produção
const JWT_ACCESS_EXPIRES_IN = '15m'; // Tempo de expiração do access token
const JWT_REFRESH_EXPIRES_IN = '7d'; // Tempo de expiração do refresh token
// Lista negra de tokens
const tokenBlacklist = [];
// Middleware de autenticação
const autenticar = (req, res, next) => {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.usuario = decoded; // Adiciona as informações do usuário à requisição
        next();
    }
    catch (err) {
        res.status(401).json({
            status: 'error',
            message: 'Token inválido ou expirado',
        });
    }
};
// Rota de login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const pessoa = yield prisma.pessoa.findUnique({
            where: { email },
        });
        if (!pessoa) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuário não encontrado',
            });
        }
        // Verifica se a senha está correta
        const senhaValida = yield bcrypt_1.default.compare(senha, pessoa.senha);
        if (!senhaValida) {
            return res.status(401).json({
                status: 'error',
                message: 'Senha incorreta',
            });
        }
        // Gera o access token
        const accessToken = jsonwebtoken_1.default.sign({ id: pessoa.id, email: pessoa.email, role: pessoa.role }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
        // Gera o refresh token
        const refreshToken = jsonwebtoken_1.default.sign({ id: pessoa.id }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
        // Armazena o refresh token no banco de dados
        yield prisma.pessoa.update({
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
                user: {
                    id: pessoa.id,
                    nome: pessoa.nome,
                    email: pessoa.email,
                    role: pessoa.role, // Passa a role do usuário
                },
            },
        });
    }
    catch (err) {
        // Log de erro
        console.error(`Erro ao fazer login: `);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao fazer login',
            error: err.message,
        });
    }
}));
// Rota de logout
router.post('/logout', autenticar, (req, res) => {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (token) {
            tokenBlacklist.push(token); // Adiciona o token à lista negra
        }
        // Log de logout
        console.log(`Usuário ${req.usuario.email} fez logout em ${new Date().toISOString()}`);
        res.status(200).json({
            status: 'success',
            message: 'Logout realizado com sucesso',
        });
    }
    catch (err) {
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
router.post('/refresh-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                status: 'error',
                message: 'Refresh token é obrigatório',
            });
        }
        // Verifica se o refresh token é válido
        const decoded = jsonwebtoken_1.default.verify(refreshToken, JWT_SECRET);
        // Busca a pessoa no banco de dados
        const pessoa = yield prisma.pessoa.findUnique({
            where: { id: decoded.id },
        });
        if (!pessoa || pessoa.refreshToken !== refreshToken) {
            return res.status(401).json({
                status: 'error',
                message: 'Refresh token inválido',
            });
        }
        // Gera um novo access token
        const accessToken = jsonwebtoken_1.default.sign({ id: pessoa.id, email: pessoa.email, role: pessoa.role }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
        res.status(200).json({
            status: 'success',
            data: {
                accessToken,
            },
        });
    }
    catch (err) {
        // Log de erro
        console.error(`Erro ao gerar novo access token: ${err.message}`);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao gerar novo access token',
            error: err.message,
        });
    }
}));
// Listar todas as pessoas
router.get('/pessoa', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pessoas = yield prisma.pessoa.findMany({
            include: {
                agendamentos: true,
                servicosOferecidos: true,
            },
        });
        res.status(200).json({
            status: 'success',
            data: pessoas,
        });
    }
    catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar pessoas',
            error: err.message,
        });
    }
}));
// Listar pessoa por ID
router.get('/pessoa/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Busca a pessoa no banco de dados
        const pessoa = yield prisma.pessoa.findUnique({
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
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
}));
// Atualizar role de uma pessoa
router.patch('/pessoa/:id/role', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const pessoaExistente = yield prisma.pessoa.findUnique({
            where: { id: parseInt(id) },
        });
        if (!pessoaExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Pessoa não encontrada',
            });
        }
        // Atualiza a role da pessoa
        const pessoaAtualizada = yield prisma.pessoa.update({
            where: { id: parseInt(id) },
            data: {
                role: role, // Converte a string para o tipo Role
            },
        });
        res.status(200).json({
            status: 'success',
            data: pessoaAtualizada,
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
}));
// Listar prestadores de serviço
router.get('/prestadores', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prestadores = yield prisma.pessoa.findMany({
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
    }
    catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar prestadores de serviço',
            error: err.message,
        });
    }
}));
// Listar clientes
router.get('/clientes', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clientes = yield prisma.pessoa.findMany({
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
    }
    catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar clientes',
            error: err.message,
        });
    }
}));
// Criar uma nova pessoa
router.post('/pessoa', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        let parsedDate;
        if (dataNascimento.includes('/')) {
            const [dia, mes, ano] = dataNascimento.split('/');
            parsedDate = new Date(`${ano}-${mes}-${dia}`);
        }
        else {
            parsedDate = new Date(dataNascimento);
        }
        // Criptografa a senha
        const senhaCriptografada = yield bcrypt_1.default.hash(senha, 10);
        // Cria a pessoa no banco de dados
        const pessoaCriada = yield prisma.pessoa.create({
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
    }
    catch (error) {
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
}));
// Atualizar uma pessoa existente
router.put('/pessoa/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        // Verifica se a pessoa existe
        const pessoaExistente = yield prisma.pessoa.findUnique({
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
        const pessoaAtualizada = yield prisma.pessoa.update({
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
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
}));
// Deletar uma pessoa
router.delete('/pessoa/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Verifica se a pessoa existe
        const pessoaExistente = yield prisma.pessoa.findUnique({
            where: { id: parseInt(id) },
        });
        if (!pessoaExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Pessoa não encontrada',
            });
        }
        // Deleta a pessoa do banco de dados
        yield prisma.pessoa.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({
            status: 'success',
            message: 'Pessoa deletada com sucesso',
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
}));
exports.default = router;
