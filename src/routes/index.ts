import express from 'express';
import pessoaRoutes from './pessoa';
import agendamentoRoutes from './agendamento';
import servicoRoutes from './servico';

const router = express.Router();

router.use(pessoaRoutes);
router.use(agendamentoRoutes);
router.use(servicoRoutes);

export default router;