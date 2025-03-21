import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import routes from './routes';
import 'dotenv/config';

const app = express();

app.use(cors());

app.use(express.json());

app.use('/api', routes)

app.get("/", async (req, res) => {
    try {
        res.json({
            status: 200,
            message: "Ok!"
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).send(error.message);
})

export default app;