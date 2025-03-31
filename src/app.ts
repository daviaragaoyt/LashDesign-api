import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import routes from './routes';

const app = express();

// Configuração do CORS
app.use(cors({
    origin: '*', // Ou especifique seus domínios permitidos
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Aumente o limite para 10MB (ou o valor que precisar)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rotas da API
app.use('/api', routes);

// Rota de health check
app.get("/", (req, res) => {
    res.json({
        status: 200,
        message: "API is running!"
    });
});

// Middleware de erro global
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Global error handler:', error);

    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && {
            error: error.message,
            stack: error.stack
        })
    });
});

export default app;