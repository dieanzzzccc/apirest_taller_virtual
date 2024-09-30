import express from 'express';
import clientesController from '../controllers/clientes_controller.js';

const router = express.Router();

// Rutas para autenticación y creación de usuarios
router.post('/verificar_usuario', clientesController.verificar_usuario);
router.post('/crear_nuevo_usuario', clientesController.crear_nuevo_usuario);

// Ruta protegida por el token
router.get('/ver_clientes', clientesController.ver_clientes);


/*
// Ruta protegida por el token
router.get('/ruta_protegida', verificarToken, (req, res) => {
    res.json({ mensaje: 'Accediste a una ruta protegida con el token correcto' });
});
*/

// Middleware de manejo de errores (opcional)
router.use((err, req, res, next) => {
    console.error('Error en la ruta:', err.message);
    res.status(500).json({
        mensaje: 'Error interno del servidor'
    });
});

export default router;