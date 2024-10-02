import pool from '../db.js';
import tokenService from '../tokenService.js'; // Importa el servicio del token

const controller = {};

// Verificar el token en una ruta protegida
controller.ver_usuarios = async (req, res) => {
    try {
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(403).json({ mensaje: 'No se proporcionó un token' });
        }

        // Verificar el token
        const decoded = await tokenService.verificarToken(token.split(' ')[1]);

        // Si el token es válido, muestra el mensaje
        console.log("¡ES EL TOKEN CORRECTO!");
        //res.status(200).json({ mensaje: 'Accediste a una ruta protegida con el token correcto' });
        const [clientes] = await pool.query('CALL VER_USUARIOS()');
        res.status(201).json({
            clientes
        });


    } catch (error) {
        console.error('Error al verificar el token:', error);
        res.status(401).json({ mensaje: 'Token inválido' });
    }
};



// Crear nuevo usuario
controller.crear_nuevo_usuario = async (req, res) => {
    const { usuario, password } = req.body;
    //console.log(nombre,password)
    try {
        // Ejecutar el procedimiento almacenado
        await pool.query('CALL CREAR_NUEVO_USUARIO(?, ?)', [usuario, password]);
        // Respuesta exitosa
        res.status(201).json({
            mensaje: `Usuario ${usuario} creado con éxito`,
        });
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ 
            mensaje: 'Error al crear el usuario'
        });
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};




// Verificar usuario y crear el token
controller.verificar_usuario = async (req, res) => {
    const {email, password } = req.body;

    try {
        const [result] = await pool.query('CALL LOGIN_USUARIO(?, ?)', [email, password]);

        if (result && result[0][0].p_is_valid == '1') {
            const payload = {
                email
            };

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