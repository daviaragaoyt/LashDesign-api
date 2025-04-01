const PORT = parseInt(`${process.env.PORT || 3000}`);

import app from './app';

// Configurações do servidor
const server = app.listen(PORT, () => {
    console.log(`\nServer is running at http://localhost:${PORT} 🚀`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Request payload limit: ${app.get('json limit')}`);
});

// Tratamento de erros do servidor
server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    } else {
        console.error('Server error:', error);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
    });
});

export default app;