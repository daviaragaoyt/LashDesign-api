const PORT = parseInt(`${process.env.PORT || 3000}`);

import app from './app';

if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => console.log(`\nServer is running at http://localhost:${PORT} 🚀`));
}
export default app