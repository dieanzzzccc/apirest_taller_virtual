import app from './App.js'
import {PORT} from  './config.js'
// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});