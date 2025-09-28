// Base de datos SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'universidad.db');
        this.db = null;
        this.init();
    }

    init() {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('❌ Error creando la base de datos:', err);
            } else {
                console.log('✅ Base de datos SQLite conectada:', this.dbPath);
                this.crearTablas().then(() => this.verificarDatosIniciales());
            }
        });
    }

    async crearTablas() {
        return new Promise((resolve, reject) => {
            // Tabla de usuarios
            this.db.run(`
                CREATE TABLE IF NOT EXISTS usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    nombre TEXT NOT NULL,
                    rol TEXT DEFAULT 'viewer',
                    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                    codigo_invitacion TEXT
                )
            `);

            // Tabla de artículos
            this.db.run(`
                CREATE TABLE IF NOT EXISTS articulos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    titulo TEXT NOT NULL,
                    contenido TEXT NOT NULL,
                    resumen TEXT,
                    categoria TEXT NOT NULL,
                    autor_id INTEGER NOT NULL,
                    autor_nombre TEXT NOT NULL,
                    fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    fecha_actualizacion DATETIME,
                    imagen TEXT DEFAULT '/images/placeholder.jpg',
                    FOREIGN KEY (autor_id) REFERENCES usuarios (id)
                )
            `, (err) => {
                if (err) reject(err);
                else {
                    console.log('✅ Tablas creadas/verificadas correctamente');
                    resolve();
                }
            });
        });
    }

    // === MÉTODO PARA FORMATEAR FECHAS ===
    formatearFecha(fechaSQLite) {
        if (!fechaSQLite) return 'Fecha no disponible';
        
        try {
            // SQLite devuelve fechas como strings, las convertimos a objeto Date
            const fecha = new Date(fechaSQLite);
            // Verificamos si es una fecha válida
            return isNaN(fecha.getTime()) ? 'Fecha no disponible' : fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Fecha no disponible';
        }
    }

    async verificarDatosIniciales() {
        try {
            // Verificar si ya existen usuarios
            const countUsuarios = await this.contarUsuarios();
            const countArticulos = await this.contarArticulos();
            
            if (countUsuarios === 0 && countArticulos === 0) {
                console.log('📝 Insertando datos iniciales...');
                await this.insertarDatosIniciales();
            } else {
                console.log(`📊 Usuarios existentes: ${countUsuarios}`);
                console.log(`📊 Artículos existentes: ${countArticulos}`);
            }
        } catch (error) {
            console.error('❌ Error verificando datos iniciales:', error);
        }
    }

    async contarUsuarios() {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT COUNT(*) as count FROM usuarios", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }

    async contarArticulos() {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT COUNT(*) as count FROM articulos", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }

    async insertarDatosIniciales() {
        try {
            // Insertar usuarios de ejemplo
            const usuariosEjemplo = [
                {
                    email: "admin@unihumboldt.edu.ve",
                    password: await bcrypt.hash("admin123", 10),
                    nombre: "Administrador Principal",
                    rol: "admin"
                },
                {
                    email: "profesor@unihumboldt.edu.ve",
                    password: await bcrypt.hash("profesor123", 10),
                    nombre: "Dr. Carlos Investigador",
                    rol: "redactor"
                }
            ];

            for (const usuario of usuariosEjemplo) {
                await this.crearUsuario(usuario);
            }

            // Insertar artículos de ejemplo
            const articulosEjemplo = [
                {
                    titulo: "Avances en Inteligencia Artificial Educativa",
                    contenido: "La IA está transformando la educación universitaria...\nNuevos métodos de enseñanza...\nResultados prometedores...",
                    resumen: "Exploramos cómo la IA está revolucionando los métodos de enseñanza.",
                    categoria: "Tecnología",
                    autor_id: 2,
                    autor_nombre: "Dr. Carlos Investigador"
                },
                {
                    titulo: "Investigación en Energías Renovables",
                    contenido: "Nuevos descubrimientos en energía solar...\nEficiencia mejorada...\nFuturas aplicaciones...",
                    resumen: "Avances en la eficiencia de paneles solares universitarios.",
                    categoria: "Ingeniería",
                    autor_id: 2,
                    autor_nombre: "Dr. Carlos Investigador"
                }
            ];

            for (const articulo of articulosEjemplo) {
                await this.crearArticulo(articulo);
            }

            console.log('✅ Datos iniciales insertados correctamente');
        } catch (error) {
            console.error('❌ Error insertando datos iniciales:', error);
        }
    }

    // ==================== MÉTODOS PARA USUARIOS ====================
    async obtenerUsuarioPorEmail(email) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM usuarios WHERE email = ?", [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async obtenerUsuarioPorId(id) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM usuarios WHERE id = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async crearUsuario(usuario) {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT OR IGNORE INTO usuarios (email, password, nombre, rol, codigo_invitacion) VALUES (?, ?, ?, ?, ?)",
                [usuario.email, usuario.password, usuario.nombre, usuario.rol, usuario.codigoInvitacion],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, ...usuario });
                }
            );
        });
    }

    // ==================== MÉTODOS PARA ARTÍCULOS ====================
    async obtenerArticulos() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT a.*, u.nombre as autor 
                 FROM articulos a 
                 JOIN usuarios u ON a.autor_id = u.id 
                 ORDER BY a.fecha_publicacion DESC`,
                (err, rows) => {
                    if (err) reject(err);
                    else {
                        // === FORMATEO DE FECHAS ===
                        const articulosFormateados = rows.map(articulo => ({
                            ...articulo,
                            fecha_publicacion: this.formatearFecha(articulo.fecha_publicacion),
                            fecha_actualizacion: this.formatearFecha(articulo.fecha_actualizacion)
                        }));
                        resolve(articulosFormateados);
                    }
                }
            );
        });
    }

    async obtenerArticuloPorId(id) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT a.*, u.nombre as autor 
                 FROM articulos a 
                 JOIN usuarios u ON a.autor_id = u.id 
                 WHERE a.id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else if (row) {
                        // === EL FORMATEO DE FECHAS ===
                        const articuloFormateado = {
                            ...row,
                            fecha_publicacion: this.formatearFecha(row.fecha_publicacion),
                            fecha_actualizacion: this.formatearFecha(row.fecha_actualizacion)
                        };
                        resolve(articuloFormateado);
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    }

    async crearArticulo(articulo) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO articulos (titulo, contenido, resumen, categoria, autor_id, autor_nombre) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [articulo.titulo, articulo.contenido, articulo.resumen, articulo.categoria, articulo.autor_id, articulo.autor_nombre],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, ...articulo });
                }
            );
        });
    }

    async actualizarArticulo(id, articulo) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE articulos 
                 SET titulo = ?, contenido = ?, resumen = ?, categoria = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
                [articulo.titulo, articulo.contenido, articulo.resumen, articulo.categoria, id],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: id, ...articulo });
                }
            );
        });
    }

    async eliminarArticulo(id) {
        return new Promise((resolve, reject) => {
            this.db.run("DELETE FROM articulos WHERE id = ?", [id], function(err) {
                if (err) reject(err);
                else resolve({ id: id });
            });
        });
    }

    async obtenerArticulosPorAutor(autorId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                "SELECT * FROM articulos WHERE autor_id = ? ORDER BY fecha_publicacion DESC",
                [autorId],
                (err, rows) => {
                    if (err) reject(err);
                    else {
                        // === FORMATEAMOS FECHAS ===
                        const articulosFormateados = rows.map(articulo => ({
                            ...articulo,
                            fecha_publicacion: this.formatearFecha(articulo.fecha_publicacion),
                            fecha_actualizacion: this.formatearFecha(articulo.fecha_actualizacion)
                        }));
                        resolve(articulosFormateados);
                    }
                }
            );
        });
    }
}

module.exports = new Database();