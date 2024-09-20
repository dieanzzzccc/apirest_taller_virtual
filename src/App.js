import express from 'express';
import pool from './db.js';
import clientes from './routes/clientes_routes.js';
import {PORT} from './config.js'
import cors from 'cors'; // Si estás usando CORS

const app = express();


// Middleware para parsear JSON
// Middleware para manejar JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Si es necesario
// Rutas
app.use('/clientes', clientes);

// Manejo de rutas inexistentes
app.use((req, res, next) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
});

export default app;