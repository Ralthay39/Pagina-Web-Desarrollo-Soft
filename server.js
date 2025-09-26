// server.js - ESTRUCTURA BASE DEL BLOG
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

// Middlewares
app.use(session({
    secret: 'blog-universitario-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        httpOnly: true
    }
}));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ==================== BASE DE DATOS SIMPLE ====================
const cargarArticulos = () => {
    try {
        const data = fs.readFileSync('./data/articulos.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const guardarArticulos = (articulos) => {
    fs.writeFileSync('./data/articulos.json', JSON.stringify(articulos, null, 2));
};

const cargarUsuarios = () => {
    try {
        const data = fs.readFileSync('./data/usuarios.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const guardarUsuarios = (usuarios) => {
    fs.writeFileSync('./data/usuarios.json', JSON.stringify(usuarios, null, 2));
};

// ==================== BASE DE DATOS SQLITE ====================
/*const database = require('./database');

// Obtener artículos
app.get('/api/articulos', async (req, res) => {
    try {
        const articulos = await database.obtenerArticulos();
        res.json(articulos);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo artículos' });
    }
});

// Crear artículo
app.post('/api/articulos', requireAuth, requireRole(['redactor', 'admin']), async (req, res) => {
    try {
        const nuevoArticulo = {
            ...req.body,
            autor_id: req.session.usuario.id
        };
        const articulo = await database.crearArticulo(nuevoArticulo);
        res.status(201).json(articulo);
    } catch (error) {
        res.status(500).json({ error: 'Error creando artículo' });
    }
});*/

// ==================== MIDDLEWARES DE AUTENTICACIÓN ====================
const requireAuth = (req, res, next) => {
    if (req.session.usuario) {
        next();
    } else {
        res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (req.session.usuario && roles.includes(req.session.usuario.rol)) {
            next();
        } else {
            res.status(403).json({ error: 'Permisos insuficientes.' });
        }
    };
};

// ==================== RUTAS PÚBLICAS ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para obtener artículos (público)
app.get('/api/articulos', (req, res) => {
    const articulos = cargarArticulos();
    res.json(articulos);
});

app.get('/api/articulos/:id', (req, res) => {
    const articulos = cargarArticulos();
    const articulo = articulos.find(a => a.id === parseInt(req.params.id));
    
    if (!articulo) {
        return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    res.json(articulo);
});

// ==================== RUTAS DE AUTENTICACIÓN ====================

// REGISTRO de nuevo usuario
app.post('/api/registro', async (req, res) => {
    try {
        const { email, password, nombre, codigoInvitacion } = req.body;

        // Validaciones básicas
        if (!email || !password || !nombre) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Validar email institucional
        const dominioPermitido = 'unihumboldt.edu.ve';
        if (!email.endsWith('@' + dominioPermitido)) {
            return res.status(400).json({ 
                error: `Solo se permiten emails institucionales (@${dominioPermitido})` 
            });
        }

        const usuarios = cargarUsuarios();

        // Verificar si el usuario ya existe
        const usuarioExistente = usuarios.find(u => u.email === email);
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // ASIGNACIÓN AUTOMÁTICA DE ROLES
        let rolAsignado = 'viewer'; // Por defecto
        
        // Códigos de invitación para roles superiores (podrían estar en otro archivo)
        const codigosInvitacion = {
            'ADMIN-2025': 'admin',
            'REDACTOR-2025 ': 'redactor'
        };

        if (codigoInvitacion && codigosInvitacion[codigoInvitacion]) {
            rolAsignado = codigosInvitacion[codigoInvitacion];
            console.log(`🔑 Usuario asignado a rol ${rolAsignado} mediante código de invitación`);
        }

        // Encriptar contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Crear nuevo usuario
        const nuevoUsuario = {
            id: usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1,
            email,
            password: hashedPassword,
            nombre,
            rol: rolAsignado,
            fechaRegistro: new Date().toISOString(),
            codigoInvitacionUsado: codigoInvitacion || null
        };

        usuarios.push(nuevoUsuario);
        guardarUsuarios(usuarios);

        // Iniciar sesión automáticamente
        req.session.usuario = {
            id: nuevoUsuario.id,
            email: nuevoUsuario.email,
            nombre: nuevoUsuario.nombre,
            rol: nuevoUsuario.rol
        };

        console.log(`✅ Nuevo usuario registrado: ${nuevoUsuario.email} como ${nuevoUsuario.rol}`);

        res.status(201).json({ 
            mensaje: `Usuario registrado exitosamente como ${rolAsignado}`,
            usuario: {
                id: nuevoUsuario.id,
                email: nuevoUsuario.email,
                nombre: nuevoUsuario.nombre,
                rol: nuevoUsuario.rol
            }
        });

    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// LOGIN de usuario
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }

        const usuarios = cargarUsuarios();
        const usuario = usuarios.find(u => u.email === email);

        if (!usuario) {
            return res.status(400).json({ error: 'Credenciales incorrectas' });
        }

        // Verificar contraseña encriptada
        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(400).json({ error: 'Credenciales incorrectas' });
        }

        // Crear sesión
        req.session.usuario = {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol
        };

        console.log('✅ Usuario logueado:', usuario.email);

        res.json({ 
            mensaje: 'Login exitoso',
            usuario: req.session.usuario
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// LOGOUT
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.json({ mensaje: 'Sesión cerrada exitosamente' });
    });
});

// OBTENER USUARIO ACTUAL
app.get('/api/usuario-actual', (req, res) => {
    if (req.session.usuario) {
        res.json({ usuario: req.session.usuario });
    } else {
        res.json({ usuario: null });
    }
});

// ==================== RUTAS PROTEGIDAS ====================

// Perfil de usuario (requiere autenticación)
app.get('/api/perfil', requireAuth, (req, res) => {
    res.json({ 
        mensaje: 'Bienvenido a tu perfil',
        usuario: req.session.usuario 
    });
});

// Ruta solo para administradores
app.get('/api/admin', requireRole(['admin']), (req, res) => {
    res.json({ mensaje: 'Panel de administración' });
});

// ==================== RUTAS PARA VISTA INDIVIDUAL DE ARTÍCULOS ====================

// Servir la página de artículo individual
app.get('/articulo/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'articulo.html'));
});

// API para obtener artículo individual con comentarios
app.get('/api/articulo-completo/:id', (req, res) => {
    const articulos = cargarArticulos();
    const articulo = articulos.find(a => a.id === parseInt(req.params.id));
    
    if (!articulo) {
        return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    
    // Por ahora devolvemos el artículo básico, en el Sprint 4 agregaremos comentarios
    res.json({
        ...articulo,
        comentarios: [] // Placeholder para comentarios
    });
});

// ==================== RUTAS PARA EL PANEL DE REDACCIÓN ====================

// Servir la página del panel de redacción
app.get('/panel', requireAuth, (req, res) => {
    // Verificar que el usuario tenga rol de redactor o admin
    if (!['redactor', 'admin'].includes(req.session.usuario.rol)) {
        return res.status(403).send('No tienes permisos para acceder al panel');
    }
    res.sendFile(path.join(__dirname, 'public', 'panel.html'));
});

// API para crear un nuevo artículo
app.post('/api/articulos', requireAuth, requireRole(['redactor', 'admin']), async (req, res) => {
    try {
        const { titulo, contenido, categoria, resumen } = req.body;

        // Validaciones
        if (!titulo || !contenido || !categoria) {
            return res.status(400).json({ error: 'Título, contenido y categoría son obligatorios' });
        }

        const articulos = cargarArticulos();
        const usuarios = cargarUsuarios();
        const usuario = usuarios.find(u => u.id === req.session.usuario.id);

        // Crear nuevo artículo
        const nuevoArticulo = {
            id: articulos.length > 0 ? Math.max(...articulos.map(a => a.id)) + 1 : 1,
            titulo,
            contenido,
            resumen: resumen || contenido.substring(0, 150) + '...', // Resumen automático si no se proporciona
            autor: usuario.nombre,
            categoria,
            fecha: new Date().toISOString(),
            imagen: '/images/placeholder.jpg' // Imagen por defecto
        };

        articulos.push(nuevoArticulo);
        guardarArticulos(articulos);

        console.log(`✅ Nuevo artículo creado: "${titulo}" por ${usuario.nombre}`);

        res.status(201).json({
            mensaje: 'Artículo creado exitosamente',
            articulo: nuevoArticulo
        });

    } catch (error) {
        console.error('Error creando artículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// API para editar un artículo existente
app.put('/api/articulos/:id', requireAuth, requireRole(['redactor', 'admin']), async (req, res) => {
    try {
        const articuloId = parseInt(req.params.id);
        const { titulo, contenido, categoria, resumen } = req.body;

        const articulos = cargarArticulos();
        const articuloIndex = articulos.findIndex(a => a.id === articuloId);

        if (articuloIndex === -1) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }

        // Verificar que el usuario es el autor o es admin
        const usuarios = cargarUsuarios();
        const usuario = usuarios.find(u => u.id === req.session.usuario.id);
        
        if (usuario.rol !== 'admin' && articulos[articuloIndex].autor !== usuario.nombre) {
            return res.status(403).json({ error: 'Solo puedes editar tus propios artículos' });
        }

        // Actualizar artículo
        articulos[articuloIndex] = {
            ...articulos[articuloIndex],
            titulo: titulo || articulos[articuloIndex].titulo,
            contenido: contenido || articulos[articuloIndex].contenido,
            categoria: categoria || articulos[articuloIndex].categoria,
            resumen: resumen || articulos[articuloIndex].resumen,
            fechaActualizacion: new Date().toISOString()
        };

        guardarArticulos(articulos);

        console.log(`✏️ Artículo actualizado: ID ${articuloId} por ${usuario.nombre}`);

        res.json({
            mensaje: 'Artículo actualizado exitosamente',
            articulo: articulos[articuloIndex]
        });

    } catch (error) {
        console.error('Error actualizando artículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// API para eliminar un artículo
app.delete('/api/articulos/:id', requireAuth, requireRole(['redactor', 'admin']), async (req, res) => {
    try {
        const articuloId = parseInt(req.params.id);

        const articulos = cargarArticulos();
        const articuloIndex = articulos.findIndex(a => a.id === articuloId);

        if (articuloIndex === -1) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }

        // Verificar permisos
        const usuarios = cargarUsuarios();
        const usuario = usuarios.find(u => u.id === req.session.usuario.id);
        
        if (usuario.rol !== 'admin' && articulos[articuloIndex].autor !== usuario.nombre) {
            return res.status(403).json({ error: 'Solo puedes eliminar tus propios artículos' });
        }

        const articuloEliminado = articulos.splice(articuloIndex, 1)[0];
        guardarArticulos(articulos);

        console.log(`🗑️ Artículo eliminado: "${articuloEliminado.titulo}" por ${usuario.nombre}`);

        res.json({ mensaje: 'Artículo eliminado exitosamente' });

    } catch (error) {
        console.error('Error eliminando artículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// API de información universitaria
app.get('/api/universidad', (req, res) => {
    const infoUniversidad = {
        nombre: "Universidad Alejandro de Humboldt",
        direccion: "Sede Dos Caminos, Av. Rómulo Gallegos, Caracas 1071, Miranda, Venezuela",
        telefono: "+58 212 238 1175",
        whatsapp: "+58 424 157 8708",
        email: "informacion@unihumboldt.edu.ve",
        descripcion: "Una concepción dinámica y vanguardista de la educación universitaria",
        ubicacion: { 
            lat: 10.49591353878546,
            lng: -66.82859160799185
        }
    };
    res.json(infoUniversidad);
});

app.use((req, res, next) => {
    console.log('📨 Petición:', req.method, req.url);
    console.log('🔐 Sesión:', req.session.usuario);
    next();
});

// Ruta de debug para ver la sesión actual
app.get('/api/debug-session', (req, res) => {
    res.json({
        session: req.session,
        usuario: req.session.usuario,
        headers: req.headers
    });
});

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, () => {
    console.log(`🚀 Blog de Seguridad en Redes ejecutándose en: http://localhost:${PORT}`);
    console.log(`🔐 Sistema de autenticación activado`);
    console.log(`📊 Endpoints disponibles:`);
    console.log(`   👉 POST /api/registro - Registrar usuario`);
    console.log(`   👉 POST /api/login - Iniciar sesión`);
    console.log(`   👉 POST /api/logout - Cerrar sesión`);
    console.log(`   👉 GET  /api/usuario-actual - Usuario actual`);
});