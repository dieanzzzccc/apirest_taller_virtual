import pool from '../db.js';
import jwt from 'jsonwebtoken'; // Importar jsonwebtoken

const controller = {};

// Verificar el token en una ruta protegida
controller.ruta_protegida = async (req, res) => {
    try {
        // Obtener el token del encabezado de la solicitud
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(403).json({ mensaje: 'No se proporcionó un token' });
        }

        // Verificar el token
        jwt.verify(token.split(' ')[1], 'l30n4rd0', (error, decoded) => {
            if (error) {
                return res.status(401).json({ mensaje: 'Token inválido' });
            }

            // Si el token es válido, se muestra el mensaje
            console.log("¡ES EL TOKEN CORRECTO!");
            res.status(200).json({ mensaje: 'Accediste a una ruta protegida con el token correcto' });
        });
    } catch (error) {
        console.error('Error al verificar el token:', error);
        res.status(500).json({
            mensaje: 'Error interno del servidor'
        });
    }
};

// Verificar usuario
controller.verificar_usuario = async (req, res) => {
    const { usuario, password } = req.body;

    try {
        // Ejecutar el procedimiento almacenado
        const [result] = await pool.query('CALL LOGIN_USUARIO(?, ?)', [usuario, password]);

        // Verificar si el usuario es válido
        if (result && result[0][0].p_is_valid == '1') {
            // Crear el payload para el token JWT
            const payload = {
                usuario: usuario,
                idUsuario: result[0][0].id_usuario // Suponiendo que tienes un campo id_usuario en el resultado
            };

            // Generar el token JWT con una clave secreta y tiempo de expiración
            const token = jwt.sign(payload, 'l30n4rd0', { expiresIn: '1h' });

            // Enviar la respuesta con el token
            res.status(200).json({ 
                mensaje: 'Autenticación exitosa',
                token: token,  // Enviar el token al cliente
                data: result[0]  // Puedes enviar información adicional si es necesario
            });
        } else {
            // Si no hay datos devueltos, se asume que el login falló
            res.status(401).json({
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }
    } catch (error) {
        console.error('Error al verificar el usuario:', error);
        res.status(500).json({ 
            mensaje: 'Error interno del servidor'
        });
    }
};

controller.crear_nuevo_usuario = async (req, res) => {

}

// Crear nuevo usuario
controller.crear_nuevo_usuario = async (req, res) => {
    const { nombre, password } = req.body;

    try {
        // Ejecutar el procedimiento almacenado
        await pool.query('CALL CREAR_NUEVO_USUARIO(?, ?)', [nombre, password]);

        // Respuesta exitosa
        res.status(201).json({
            mensaje: `Usuario ${nombre} creado con éxito`,
        });
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ 
            mensaje: 'Error al crear el usuario'
        });
    }
};

export default controller;