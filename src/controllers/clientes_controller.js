import pool from '../db.js';
import tokenService from '../services/tokenService.js'; // Importa el servicio del token
import { S3Client, PutObjectCommand, ListObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'; // Importa getSignedUrl para generar URLs firmadas
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config(); // Cargar las variables de entorno

const controller = {};

// Configura el cliente S3
const s3 = new S3Client({
    region: process.env.AWS_REGION, // Asegúrate de que esta línea esté presente
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});


// Obtener la lista de archivos para un curso específico
controller.archivos_por_curso = async (req, res) => {
    const cursoId = req.params.cursoId; // Obtener el ID del curso desde los parámetros

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Prefix: `${cursoId}/`, // Solo archivos dentro de la carpeta del curso
    };

    try {
        const command = new ListObjectsCommand(params);
        const data = await s3.send(command);

        // Filtra los objetos para eliminar las carpetas
        const archivos = await Promise.all(data.Contents.filter(archivo => !archivo.Key.endsWith('/')).map(async (archivo) => {
            const getObjectParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: archivo.Key,
            };
            const signedUrl = await getSignedUrl(s3, new GetObjectCommand(getObjectParams), { expiresIn: 3600 }); // URL válida por 1 hora

            return {
                key: archivo.Key.replace(`${cursoId}/`, ''),  // Elimina el prefijo del curso
                lastModified: archivo.LastModified,
                url: signedUrl,
            };
        }));

        res.status(200).json(archivos);
    } catch (error) {
        console.error('Error al listar archivos del curso:', error);
        res.status(500).json({ mensaje: 'Error al listar archivos del curso' });
    }
};


controller.crear_nuevo_curso = async (req, res) => {
    const { titulo, descripcion, precio } = req.body;

    try {
        // Llamar al procedimiento almacenado y obtener el ID del nuevo curso
        const [result] = await pool.query('CALL crear_nuevo_curso(?, ?, ?);', [titulo, descripcion, precio]);
        
        const idNuevoCurso = result[0][0].id; // Captura el ID del nuevo curso

        // Crear carpeta en S3 con el ID del nuevo curso
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${idNuevoCurso}/`, // Crear un directorio con el ID
        };

        await s3.send(new PutObjectCommand(params));

        res.status(201).json({ mensaje: `Curso ${titulo} creado con éxito`, id: idNuevoCurso });
    } catch (error) {
        console.error('Error al crear el curso:', error);
        res.status(500).json({ mensaje: 'Error al crear el curso' });
    }
};
// Ver usuarios (ya protegido por el middleware)
controller.ver_usuarios = async (req, res) => {
    try {
        const [clientes] = await pool.query('CALL VER_USUARIOS()');
        res.status(201).json({
            clientes
        });
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ mensaje: 'Error al obtener los usuarios' });
    }
};

// Consultar cursos disponibles
controller.ver_cursos = async (req, res) => {
    try {
        const [cursos] = await pool.query('CALL ver_cursos()');
        res.status(200).json({
            cursos
        });
    } catch (error) {
        console.error('Error al consultar los cursos:', error);
        res.status(500).json({ mensaje: 'Error al consultar los cursos' });
    }
};



// Obtener la lista de videos con URLs firmadas
controller.listar_videos = async (req, res) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
    };

    try {
        const command = new ListObjectsCommand(params);
        const data = await s3.send(command);
        
        // Genera las URLs firmadas para cada archivo
        const archivos = await Promise.all(data.Contents.map(async (archivo) => {
            const getObjectParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: archivo.Key,
            };
            const signedUrl = await getSignedUrl(s3, new GetObjectCommand(getObjectParams), { expiresIn: 3600 }); // URL válida por 1 hora

            return {
                key: archivo.Key,
                lastModified: archivo.LastModified,
                url: signedUrl,
            };
        }));

        res.status(200).json(archivos);
    } catch (error) {
        console.error('Error al listar videos:', error);
        res.status(500).json({ mensaje: 'Error al listar videos' });
    }
};

// Crear nuevo usuario
controller.crear_nuevo_usuario = async (req, res) => {
    const { usuario, password, nombres, apellidos, telefono, email, rol } = req.body;
    try {
        await pool.query('CALL CREAR_NUEVO_USUARIO(?,?,?,?,?,?,?,NOW())', [usuario, password, nombres, apellidos, telefono, email, rol]); // SE COLOCA EMAIL COMO USUARIO OJO
        res.status(201).json({
            mensaje: `Usuario ${usuario} creado con éxito`,
        });
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ mensaje: 'Error al crear el usuario' });
    }
};

controller.subir_archivo = async (req, res) => {
    if (!req.file || !req.body.cursoId) {
        return res.status(400).json({ mensaje: 'No se subió ningún archivo o no se proporcionó el ID del curso' });
    }

    const cursoId = req.body.cursoId; // Obtén el ID del curso desde el cuerpo de la solicitud
    const fileContent = fs.readFileSync(req.file.path);
    const fileName = req.file.originalname;

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${cursoId}/${fileName}`, // Usa el ID del curso como prefijo
        Body: fileContent,
        ContentType: req.file.mimetype,
    };

    try {
        const command = new PutObjectCommand(params);
        await s3.send(command);

        fs.unlinkSync(req.file.path);

        res.status(200).json({
            mensaje: 'Archivo subido correctamente',
            ruta: `https://${params.Bucket}.s3.amazonaws.com/${cursoId}/${fileName}`, // URL del archivo en S3
        });
    } catch (error) {
        console.error('Error al subir el archivo:', error);
        res.status(500).json({ mensaje: 'Error al subir el archivo' });
    }
};


// Verificar usuario y crear el token
controller.verificar_usuario = async (req, res) => {
    const { usuario, password } = req.body;
    try {
        const [result] = await pool.query('CALL LOGIN_USUARIO(?, ?)', [usuario, password]);

        if (result && result[0][0].p_is_valid == '1') {
            const payload = { usuario };

            // Generar el token usando el servicio
            const token = tokenService.generarToken(payload);

            res.status(200).json({
                mensaje: 'Autenticación exitosa',
                token,
                result
            });
        } else {
            res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error al verificar el usuario:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

export default controller;