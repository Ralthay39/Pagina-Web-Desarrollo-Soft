// crear-usuarios.js - Script para generar usuarios default con contraseñas encriptadas
const bcrypt = require('bcrypt');
const fs = require('fs');

async function crearUsuariosIniciales() {
    console.log('🔐 Creando usuarios iniciales...');
    
    // Contraseñas que vamos a usar
    const passwordAdmin = 'admin123';
    const passwordRedactor = 'redactor123';
    const passwordViewer = 'viewer123';

    // Encriptar contraseñas
    const saltRounds = 10;
    const hashAdmin = await bcrypt.hash(passwordAdmin, saltRounds);
    const hashRedactor = await bcrypt.hash(passwordRedactor, saltRounds);
    const hashViewer = await bcrypt.hash(passwordViewer, saltRounds);

    const usuarios = [
        {
            id: 1,
            email: "admin@unihumboldt.edu.ve",
            password: hashAdmin,
            nombre: "Administrador Principal",
            rol: "admin",
            fechaRegistro: new Date().toISOString()
        },
        {
            id: 2,
            email: "redactor@unihumboldt.edu.ve", 
            password: hashRedactor,
            nombre: "Profesor Investigador",
            rol: "redactor",
            fechaRegistro: new Date().toISOString()
        },
        {
            id: 3,
            email: "viewer@unihumboldt.edu.ve",
            password: hashViewer, 
            nombre: "Estudiante Viewer",
            rol: "viewer",
            fechaRegistro: new Date().toISOString()
        }
    ];

    // Guardar en el archivo
    fs.writeFileSync('./data/usuarios.json', JSON.stringify(usuarios, null, 2));
    
    console.log('✅ Usuarios creados exitosamente:');
    console.log('   👑 Admin: admin@unihumboldt.edu.ve / admin123');
    console.log('   ✍️  Redactor: redactor@unihumboldt.edu.ve / redactor123');
    console.log('   👀 Viewer: viewer@unihumboldt.edu.ve / viewer123');
}

crearUsuariosIniciales().catch(console.error);