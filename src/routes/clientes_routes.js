// routes/clientes_router.js
import express from 'express';
import clientesController from '../controllers/clientes_controller.js';
import verificarToken from '../middleware/auth.js'; // Importar el middleware

const router = express.Router();

// Rutas para autenticación y creación de usuarios
router.post('/verificar_usuario', clientesController.verificar_usuario);
router.post('/crear_nuevo_usuario', clientesController.crear_nuevo_usuario);

// Ruta protegida por el token
router.get('/ver_usuarios', verificarToken, clientesController.ver_usuarios); // Aplicar el middleware

// Middleware de manejo de errores (opcional)
router.use((err, req, res, next) => {
    console.error('Error en la ruta:', err.message);
    res.status(500).json({
        mensaje: 'Error interno del servidor'
    });
});

export default router;