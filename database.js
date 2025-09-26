// database.js - Base de datos SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbPath = path.join(__dirname, 'database.sqlite');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error conectando a SQLite:', err);
            } else {
                console.log('✅ Conectado a SQLite database');
                this.crearTablas();
            }
        });
    }

    crearTablas() {
        // Tabla de usuarios
        this.db.run(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                nombre TEXT NOT NULL,
                rol TEXT DEFAULT 'viewer',
                fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
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
                fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                imagen TEXT,
                FOREIGN KEY (autor_id) REFERENCES usuarios (id)
            )
        `);

        // Tabla de comentarios (WIP)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS comentarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                articulo_id INTEGER NOT NULL,
                usuario_id INTEGER NOT NULL,
                contenido TEXT NOT NULL,
                fecha_comentario DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (articulo_id) REFERENCES articulos (id),
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
            )
        `);
    }

    // Métodos para usuarios
    async crearUsuario(usuario) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO usuarios (email, password, nombre, rol) VALUES (?, ?, ?, ?)`,
                [usuario.email, usuario.password, usuario.nombre, usuario.rol],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, ...usuario });
                }
            );
        });
    }

    async obtenerUsuarioPorEmail(email) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM usuarios WHERE email = ?`,
                [email],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    // Métodos para artículos
    async crearArticulo(articulo) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO articulos (titulo, contenido, resumen, categoria, autor_id) VALUES (?, ?, ?, ?, ?)`,
                [articulo.titulo, articulo.contenido, articulo.resumen, articulo.categoria, articulo.autor_id],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, ...articulo });
                }
            );
        });
    }

    async obtenerArticulos() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT a.*, u.nombre as autor 
                 FROM articulos a 
                 JOIN usuarios u ON a.autor_id = u.id 
                 ORDER BY a.fecha_publicacion DESC`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
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
                    else resolve(row);
                }
            );
        });
    }
}

module.exports = new Database();