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
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const timezone = 'America/Sao_Paulo';
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
// Listar todos os agendamentos
router.get('/agendamento', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agendamentos = yield prisma.agendamento.findMany({
            include: {
                cliente: true, // Inclui informações do cliente
                servico: true, // Inclui informações do serviço
            },
        });
        res.status(200).json({
            status: 'success',
            data: agendamentos,
        });
    }
    catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar agendamentos',
            error: err.message,
        });
    }
}));
// Listar agendamento por ID
router.get('/agendamento/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Busca o agendamento no banco de dados
        const agendamento = yield prisma.agendamento.findUnique({
            where: {
                id: parseInt(id),
            },
            include: {
                cliente: true, // Inclui informações do cliente
                servico: true, // Inclui informações do serviço
            },
        });
        // Verifica se o agendamento foi encontrado
        if (!agendamento) {
            return res.status(404).json({
                status: 'error',
                message: 'Agendamento não encontrado',
            });
        }
        // Retorna o agendamento encontrado
        res.status(200).json({
            status: 'success',
            data: agendamento,
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Agendamento não encontrado',
                });
            }
        }
        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar agendamento',
            error: err.message,
        });
    }
}));
router.post('/agendamento', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newAgendamento = req.body;
        // Validação básica dos campos obrigatórios
        if (!newAgendamento.dataHora || !newAgendamento.clienteId || !newAgendamento.servicoId) {
            return res.status(400).json({
                status: 'error',
                message: 'Data/hora, ID do cliente e ID do serviço são obrigatórios',
            });
        }
        // Formata a data/hora no horário de Brasília
        const dataHoraAgendamento = moment_timezone_1.default.tz(newAgendamento.dataHora, 'DD/MM/YYYY:HH:mm', timezone);
        // Verifica se a data/hora é válida
        if (!dataHoraAgendamento.isValid()) {
            return res.status(400).json({
                status: 'error',
                message: 'Data/hora inválida. Use o formato "DD/MM/YYYY:HH:mm" (ex: "25/10/2025:17:30").',
            });
        }
        // Verifica se a data/hora do agendamento já passou
        const dataHoraAtual = (0, moment_timezone_1.default)().tz(timezone);
        if (dataHoraAgendamento.isBefore(dataHoraAtual)) {
            return res.status(400).json({
                status: 'error',
                message: 'A data/hora do agendamento já passou.',
            });
        }
        // Cria o agendamento no banco de dados
        const agendamentoCriado = yield prisma.agendamento.create({
            data: {
                dataHora: dataHoraAgendamento.toDate(),
                disponivel: false, // Define como false, pois o horário estará ocupado
                clienteId: parseInt(newAgendamento.clienteId),
                servicoId: parseInt(newAgendamento.servicoId),
            },
        });
        res.status(201).json({
            status: 'success',
            data: agendamentoCriado,
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2002') {
                return res.status(409).json({
                    status: 'error',
                    message: 'Agendamento já existe',
                });
            }
        }
        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao criar agendamento',
            error: err.message,
        });
    }
}));
router.put('/agendamento/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        // Verifica se o agendamento existe
        const agendamentoExistente = yield prisma.agendamento.findUnique({
            where: { id: parseInt(id) },
        });
        if (!agendamentoExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Agendamento não encontrado',
            });
        }
        // Formata a data/hora no horário de Brasília, se fornecida
        let dataHoraFormatada;
        if (updatedData.dataHora) {
            dataHoraFormatada = moment_timezone_1.default.tz(updatedData.dataHora, 'DD/MM/YYYY:HH:mm', timezone);
            // Verifica se a data/hora é válida
            if (!dataHoraFormatada.isValid()) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data/hora inválida. Use o formato "DD/MM/YYYY:HH:mm" (ex: "25/10/2025:17:30").',
                });
            }
            // Verifica se a data/hora do agendamento já passou
            const dataHoraAtual = (0, moment_timezone_1.default)().tz(timezone);
            if (dataHoraFormatada.isBefore(dataHoraAtual)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'A data/hora do agendamento já passou.',
                });
            }
        }
        // Atualiza o agendamento no banco de dados
        const agendamentoAtualizado = yield prisma.agendamento.update({
            where: { id: parseInt(id) },
            data: {
                dataHora: dataHoraFormatada ? dataHoraFormatada.toDate() : agendamentoExistente.dataHora,
                clienteId: parseInt(updatedData.clienteId) || agendamentoExistente.clienteId,
                servicoId: parseInt(updatedData.servicoId) || agendamentoExistente.servicoId,
                disponivel: updatedData.disponivel !== undefined ? updatedData.disponivel : agendamentoExistente.disponivel,
            },
        });
        res.status(200).json({
            status: 'success',
            data: agendamentoAtualizado,
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Agendamento não encontrado',
                });
            }
        }
        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar agendamento',
            error: err.message,
        });
    }
}));
// Deletar um agendamento
router.delete('/agendamento/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Verifica se o agendamento existe
        const agendamentoExistente = yield prisma.agendamento.findUnique({
            where: { id: parseInt(id) },
        });
        if (!agendamentoExistente) {
            return res.status(404).json({
                status: 'error',
                message: 'Agendamento não encontrado',
            });
        }
        // Deleta o agendamento do banco de dados
        yield prisma.agendamento.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({
            status: 'success',
            message: 'Agendamento deletado com sucesso',
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            // Erros específicos do Prisma
            if (err.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    message: 'Agendamento não encontrado',
                });
            }
        }
        // Erro genérico
        res.status(500).json({
            status: 'error',
            message: 'Erro ao deletar agendamento',
            error: err.message,
        });
    }
}));
exports.default = router;
