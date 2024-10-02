
import tokenService from '../services/tokenService.js';

const verificarToken = async (req, res, next) => {
    try {
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(403).json({ mensaje: 'No se proporcionó un token' });
        }

        // Verificar el token
        const decoded = await tokenService.verificarToken(token.split(' ')[1]);

        // Asignar el usuario decodificado al objeto req para usarlo en el controlador
        req.usuario = decoded;

        // Continuar al siguiente middleware/controlador
        next();
    } catch (error) {
        console.error('Error al verificar el token:', error);
        return res.status(401).json({ mensaje: 'Token inválido' });
    }
};

export default verificarToken;