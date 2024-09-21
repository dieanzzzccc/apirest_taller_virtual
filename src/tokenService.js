import jwt from 'jsonwebtoken';

const secretKey = 'l30n4rd0'; // Mueve la clave secreta aquí

const tokenService = {
    // Método para crear un token
    generarToken: (payload) => {
        return jwt.sign(payload, secretKey, { expiresIn: '1h' });
    },

    // Método para verificar un token
    verificarToken: (token) => {
        return new Promise((resolve, reject) => {
            jwt.verify(token, secretKey, (error, decoded) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(decoded);
                }
            });
        });
    }
};

export default tokenService;