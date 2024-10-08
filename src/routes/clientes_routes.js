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

// Ruta para subir archivos
router.post('/subir_archivo', upload.single('file'), clientesController.subir_archivo);

router.get('/ver_cursos', clientesController.ver_cursos);
// Otras rutas...
router.post('/verificar_usuario', clientesController.verificar_usuario);
router.post('/crear_nuevo_usuario', clientesController.crear_nuevo_usuario);
router.post('/crear_nuevo_curso', clientesController.crear_nuevo_curso);
router.get('/ver_usuarios', clientesController.ver_usuarios);
router.get('/listar_videos', clientesController.listar_videos);
router.get('/archivos_por_curso/:cursoId', clientesController.archivos_por_curso);
export default router;