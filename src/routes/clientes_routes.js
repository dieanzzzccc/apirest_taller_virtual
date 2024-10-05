import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import clientesController from '../controllers/clientes_controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configuración de Multer para subir archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads'); // Correcta ruta a uploads
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Agregar timestamp para evitar conflictos de nombre
    }
});

const upload = multer({ storage: storage });

// Ruta para subir videos
router.post('/subir_video', upload.single('video'), clientesController.subir_video);

// Otras rutas...
router.post('/verificar_usuario', clientesController.verificar_usuario);
router.post('/crear_nuevo_usuario', clientesController.crear_nuevo_usuario);
router.get('/ver_usuarios', clientesController.ver_usuarios);
router.get('/listar_videos', clientesController.listar_videos);
export default router;