import pool from '../db.js';
import tokenService from '../services/tokenService.js'; // Importa el servicio del token
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

// Crear nuevo usuario
controller.crear_nuevo_usuario = async (req, res) => {
    const { usuario, password, nombres, apellidos, email, rol } = req.body;
    try {
        await pool.query('CALL CREAR_NUEVO_USUARIO(?,?,?,?,?,?,NOW())', [email, password, nombres, apellidos, email, rol]); // SE COLOCA EMAIL COMO USUARIO OJO
        res.status(201).json({
            mensaje: `Usuario ${usuario} creado con éxito`,
        });
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ mensaje: 'Error al crear el usuario' });
    }
};

// Subir video a S3
controller.subir_video = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ mensaje: 'No se subió ningún archivo' });
    }

    const fileContent = fs.readFileSync(req.file.path);
    const fileName = Date.now() + '-' + req.file.originalname; // Nombre único para el archivo

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME, // Cambia esto por el nombre de tu bucket
        Key: fileName,
        Body: fileContent,
        ContentType: req.file.mimetype,
    };

    try {
        const command = new PutObjectCommand(params);
        await s3.send(command);
        
        // Elimina el archivo local después de subirlo
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            mensaje: 'Video subido correctamente',
            ruta: `https://${params.Bucket}.s3.amazonaws.com/${fileName}`, // URL del video en S3
        });
    } catch (error) {
        console.error('Error al subir el video:', error);
        res.status(500).json({ mensaje: 'Error al subir el video' });
    }
};

// Verificar usuario y crear el token
controller.verificar_usuario = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [result] = await pool.query('CALL LOGIN_USUARIO(?, ?)', [email, password]);

        if (result && result[0][0].p_is_valid == '1') {
            const payload = { email };

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