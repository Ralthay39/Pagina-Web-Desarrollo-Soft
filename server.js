// server.js - BLOG UNIVERSITARIO CON BASE DE DATOS SQLite
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');

// Importar base de datos SQLite
const database = require('./database');

const app = express();
const PORT = 3000;

// ==================== CONFIGURACIÓN DE MIDDLEWARES ====================
app.use(session({
    secret: 'blog-universitario-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// ==================== RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ====================

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Página de artículo individual
app.get('/articulo/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'articulo.html'));
});

// API para obtener artículos (público)
app.get('/api/articulos', async (req, res) => {
    try {
        const articulos = await database.obtenerArticulos();
        res.json(articulos);
    } catch (error) {
        console.error('❌ Error obteniendo artículos:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// API para obtener artículo individual
app.get('/api/articulos/:id', async (req, res) => {
    try {
        const articulo = await database.obtenerArticuloPorId(parseInt(req.params.id));
        
        if (!articulo) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        
        res.json(articulo);
    } catch (error) {
        console.error('❌ Error obteniendo artículo:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// API para obtener artículo completo
app.get('/api/articulo-completo/:id', async (req, res) => {
    try {
        const articulo = await database.obtenerArticuloPorId(parseInt(req.params.id));
        
        if (!articulo) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }
        
        // Placeholder para comentarios (espacio para implementación)
        res.json({
            ...articulo,
            comentarios: []
        });
    } catch (error) {
        console.error('❌ Error obteniendo artículo completo:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
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
        if (!email.endsWith('@unihumboldt.edu.ve')) {
            return res.status(400).json({ 
                error: 'Solo se permiten emails institucionales (@unihumboldt.edu.ve)' 
            });
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await database.obtenerUsuarioPorEmail(email);
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // ASIGNACIÓN AUTOMÁTICA DE ROLES
        let rolAsignado = 'viewer';
        const codigosInvitacion = {
            'ADMIN-2025': 'admin',
            'REDACTOR-2025': 'redactor'
        };

        if (codigoInvitacion && codigosInvitacion[codigoInvitacion]) {
            rolAsignado = codigosInvitacion[codigoInvitacion];
            console.log(`🔑 Usuario asignado a rol ${rolAsignado} mediante código de invitación`);
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear nuevo usuario
        const nuevoUsuario = await database.crearUsuario({
            email,
            password: hashedPassword,
            nombre,
            rol: rolAsignado,
            codigoInvitacion: codigoInvitacion || null
        });

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
            usuario: req.session.usuario
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

        // Buscar usuario
        const usuario = await database.obtenerUsuarioPorEmail(email);
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

// ==================== RUTAS PARA EL PANEL DE REDACCIÓN ====================

// Página del panel de redacción
app.get('/panel', requireAuth, requireRole(['redactor', 'admin']), (req, res) => {
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

        // Obtener información del autor
        const usuario = await database.obtenerUsuarioPorId(req.session.usuario.id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Crear nuevo artículo
        const nuevoArticulo = await database.crearArticulo({
            titulo,
            contenido,
            resumen: resumen || contenido.substring(0, 150) + '...',
            categoria,
            autor_id: usuario.id,
            autor_nombre: usuario.nombre
        });

        console.log(`✅ Nuevo artículo creado: "${titulo}" por ${usuario.nombre}`);

        res.status(201).json({
            mensaje: 'Artículo creado exitosamente',
            articulo: nuevoArticulo
        });

    } catch (error) {
        console.error('❌ Error creando artículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// API para editar un artículo existente
app.put('/api/articulos/:id', requireAuth, requireRole(['redactor', 'admin']), async (req, res) => {
    try {
        const articuloId = parseInt(req.params.id);
        const { titulo, contenido, categoria, resumen } = req.body;

        // Verificar que el artículo existe
        const articuloExistente = await database.obtenerArticuloPorId(articuloId);
        if (!articuloExistente) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }

        // Verificar permisos de edición
        const usuario = await database.obtenerUsuarioPorId(req.session.usuario.id);
        if (usuario.rol !== 'admin' && articuloExistente.autor_id !== usuario.id) {
            return res.status(403).json({ error: 'Solo puedes editar tus propios artículos' });
        }

        // Actualizar artículo
        const articuloActualizado = await database.actualizarArticulo(articuloId, {
            titulo: titulo || articuloExistente.titulo,
            contenido: contenido || articuloExistente.contenido,
            categoria: categoria || articuloExistente.categoria,
            resumen: resumen || articuloExistente.resumen
        });

        console.log(`✏️ Artículo actualizado: ID ${articuloId} por ${usuario.nombre}`);

        res.json({
            mensaje: 'Artículo actualizado exitosamente',
            articulo: articuloActualizado
        });

    } catch (error) {
        console.error('❌ Error actualizando artículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// API para eliminar un artículo
app.delete('/api/articulos/:id', requireAuth, requireRole(['redactor', 'admin']), async (req, res) => {
    try {
        const articuloId = parseInt(req.params.id);

        // Verificar que el artículo existe
        const articuloExistente = await database.obtenerArticuloPorId(articuloId);
        if (!articuloExistente) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }

        // Verificar permisos de eliminación
        const usuario = await database.obtenerUsuarioPorId(req.session.usuario.id);
        if (usuario.rol !== 'admin' && articuloExistente.autor_id !== usuario.id) {
            return res.status(403).json({ error: 'Solo puedes eliminar tus propios artículos' });
        }

        // Eliminar artículo
        await database.eliminarArticulo(articuloId);

        console.log(`🗑️ Artículo eliminado: "${articuloExistente.titulo}" por ${usuario.nombre}`);

        res.json({ mensaje: 'Artículo eliminado exitosamente' });

    } catch (error) {
        console.error('❌ Error eliminando artículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==================== APIs ADICIONALES ====================

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

// ==================== UTILIDADES DE DESARROLLO ====================

// Middleware de logging para desarrollo
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
    console.log(`🗄️  Base de datos SQLite activa`);
    console.log(`📊 Endpoints disponibles:`);
    console.log(`   👉 GET  /api/articulos - Listar artículos`);
    console.log(`   👉 POST /api/registro - Registrar usuario`);
    console.log(`   👉 POST /api/login - Iniciar sesión`);
    console.log(`   👉 POST /api/articulos - Crear artículo (requiere permisos)`);
});