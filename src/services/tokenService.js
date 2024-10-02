import jwt from 'jsonwebtoken';

const secretKey = 'tu_clave_secreta'; // Debes almacenar esta clave en una variable de entorno

const tokenService = {
    generarToken: (payload) => {
        return jwt.sign(payload, secretKey, { expiresIn: '1h' });
    },
    verificarToken: (token) => {
        return jwt.verify(token, secretKey);
    }
};

export default tokenService;