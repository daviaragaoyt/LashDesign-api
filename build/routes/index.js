"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pessoa_1 = __importDefault(require("./pessoa"));
const agendamento_1 = __importDefault(require("./agendamento"));
const servico_1 = __importDefault(require("./servico"));
const router = express_1.default.Router();
router.use(pessoa_1.default);
router.use(agendamento_1.default);
router.use(servico_1.default);
exports.default = router;
