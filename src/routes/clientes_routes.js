import multer from 'multer';
import express from 'express';
import clientesController from '../controllers/clientes_controller.js';
import verificarToken from '../middleware/verificarToken.js'; // Middleware de autenticación

const router = express.Router();

// Configurar Multer para la subida de videos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Carpeta de destino
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Nombre único para evitar sobrescritura
    }
});
const upload = multer({ storage });

// Rutas existentes
router.post('/verificar_usuario', clientesController.verificar_usuario);
router.post('/crear_nuevo_usuario', clientesController.crear_nuevo_usuario);
router.get('/ver_usuarios', verificarToken, clientesController.ver_usuarios);

// Nueva ruta para subir videos
router.post('/subir_video', verificarToken, upload.single('video'), clientesController.subir_video);

export default router;