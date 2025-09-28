// Manejo de la vista individual de artículos
class ArticuloManager {
    constructor() {
        this.articuloActual = null;
        this.todosArticulos = [];
        this.comentarios = [];
        this.authManager = null;
        this.init();
    }

    async init() {
        // Inicializar auth manager
        this.authManager = window.authManager;
        
        // Esperar a que auth se inicialice
        setTimeout(async () => {
            await this.cargarArticuloActual();
            await this.cargarTodosArticulos();
            await this.cargarComentarios();
            this.configurarNavegacion();
            this.configurarComentarios();
            this.actualizarInterfazComentarios();
        }, 100);
    }

    // Obtener ID del artículo de la URL
    obtenerIdDeURL() {
        const path = window.location.pathname;
        const match = path.match(/\/articulo\/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    // Cargar el artículo actual
    async cargarArticuloActual() {
        const articuloId = this.obtenerIdDeURL();
        
        if (!articuloId) {
            this.mostrarError('ID de artículo no válido');
            return;
        }

        try {
            const response = await fetch(`/api/articulo-completo/${articuloId}`);
            
            if (!response.ok) {
                throw new Error('Artículo no encontrado');
            }

            this.articuloActual = await response.json();
            console.log('📄 Artículo cargado:', this.articuloActual); // Debug
            this.mostrarArticulo();
            
        } catch (error) {
            console.error('Error cargando artículo:', error);
            this.mostrarError('No se pudo cargar el artículo');
        }
    }

    // Cargar todos los artículos para navegación
    async cargarTodosArticulos() {
        try {
            const response = await fetch('/api/articulos');
            this.todosArticulos = await response.json();
            // Ordenar por fecha de publicación (ya viene formateada del servidor)
            this.todosArticulos.sort((a, b) => b.id - a.id); // Ordenar por ID (más reciente primero)
        } catch (error) {
            console.error('Error cargando artículos:', error);
        }
    }

    // Cargar comentarios
    async cargarComentarios() {
        // Por ahora cargamos comentarios vacíos
        this.comentarios = [];
        this.actualizarContadorComentarios();
    }

    // Mostrar el artículo en la página
    mostrarArticulo() {
        if (!this.articuloActual) return;

        const contenido = document.getElementById('contenido-articulo');
        
        contenido.innerHTML = `
            <div class="articulo-header">
                <span class="articulo-categoria">${this.articuloActual.categoria}</span>
                <h1 class="articulo-titulo">${this.articuloActual.titulo}</h1>
                <div class="articulo-meta">
                    <span class="articulo-autor">${this.articuloActual.autor || this.articuloActual.autor_nombre}</span>
                    <span class="articulo-fecha">${this.articuloActual.fecha_publicacion}</span>
                </div>
            </div>
            
            <div class="articulo-contenido">
                ${this.formatearContenido(this.articuloActual.contenido)}
            </div>
        `;

        // Actualizar breadcrumb
        const breadcrumbCategoria = document.getElementById('breadcrumb-categoria');
        const breadcrumbTitulo = document.getElementById('breadcrumb-titulo');
        
        if (breadcrumbCategoria) breadcrumbCategoria.textContent = this.articuloActual.categoria;
        if (breadcrumbTitulo) breadcrumbTitulo.textContent = this.articuloActual.titulo;

        // Actualizar título de la página
        document.title = `${this.articuloActual.titulo} - Blog Universitario`;
    }

    // Formatear contenido
    formatearContenido(contenido) {
        return contenido.split('\n').filter(p => p.trim()).map(parrafo => 
            `<p>${parrafo}</p>`
        ).join('');
    }

    // Configurar navegación entre artículos
    configurarNavegacion() {
        const btnAnterior = document.getElementById('btn-anterior');
        const btnSiguiente = document.getElementById('btn-siguiente');

        if (btnAnterior && btnSiguiente && this.todosArticulos.length > 0 && this.articuloActual) {
            const currentIndex = this.todosArticulos.findIndex(a => a.id === this.articuloActual.id);
            
            // Artículo anterior
            if (currentIndex > 0) {
                btnAnterior.disabled = false;
                btnAnterior.onclick = () => this.navegarAArticulo(this.todosArticulos[currentIndex - 1].id);
            } else {
                btnAnterior.disabled = true;
            }

            // Artículo siguiente
            if (currentIndex < this.todosArticulos.length - 1) {
                btnSiguiente.disabled = false;
                btnSiguiente.onclick = () => this.navegarAArticulo(this.todosArticulos[currentIndex + 1].id);
            } else {
                btnSiguiente.disabled = true;
            }
        }
    }

    // Configurar sistema de comentarios
    configurarComentarios() {
        const formComentario = document.getElementById('form-comentario');
        if (formComentario) {
            formComentario.onsubmit = (e) => this.enviarComentario(e);
        }

        // Escuchar cambios en la autenticación
        if (this.authManager) {
            // Sobrescribir la función de actualizarInterfaz del authManager
            const originalUpdate = this.authManager.actualizarInterfaz;
            this.authManager.actualizarInterfaz = () => {
                originalUpdate.call(this.authManager);
                this.actualizarInterfazComentarios();
            };
        }
    }

    // Actualizar interfaz de comentarios según autenticación
    actualizarInterfazComentarios() {
        const noAutenticado = document.getElementById('no-autenticado');
        const autenticado = document.getElementById('autenticado');
        
        if (noAutenticado && autenticado) {
            if (this.authManager && this.authManager.usuario) {
                // Usuario autenticado
                noAutenticado.style.display = 'none';
                autenticado.style.display = 'block';
            } else {
                // Usuario no autenticado
                noAutenticado.style.display = 'block';
                autenticado.style.display = 'none';
            }
        }
    }

    // Enviar comentario (en desarrollo)
    async enviarComentario(event) {
        event.preventDefault();
        
        if (!this.authManager || !this.authManager.usuario) {
            this.mostrarMensaje('❌ Debes iniciar sesión para comentar', 'error');
            return;
        }

        const texto = document.getElementById('texto-comentario').value.trim();
        
        if (!texto) {
            this.mostrarMensaje('❌ El comentario no puede estar vacío', 'error');
            return;
        }

        // Placeholder - en Sprint 4 esto se conectará al backend
        this.mostrarMensaje('🚧 Sistema de comentarios en desarrollo', 'info');
        
        // Limpiar formulario
        document.getElementById('texto-comentario').value = '';
    }

    // Actualizar contador de comentarios
    actualizarContadorComentarios() {
        const contador = document.getElementById('contador-comentarios');
        if (contador) {
            contador.textContent = `(${this.comentarios.length})`;
        }
    }

    // Navegar a otro artículo
    navegarAArticulo(articuloId) {
        window.location.href = `/articulo/${articuloId}`;
    }

    mostrarError(mensaje) {
        const contenido = document.getElementById('contenido-articulo');
        if (contenido) {
            contenido.innerHTML = `
                <div class="error">
                    <h2>❌ Error</h2>
                    <p>${mensaje}</p>
                    <a href="/">Volver al inicio</a>
                </div>
            `;
        }
    }

    mostrarMensaje(mensaje, tipo) {
        // Reutilizar la función del authManager si existe
        if (this.authManager && this.authManager.mostrarMensaje) {
            this.authManager.mostrarMensaje(mensaje, tipo);
        } else {
            // Fallback básico
            alert(mensaje);
        }
    }
}

// Inicializar cuando la página cargue
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar auth manager primero si no existe
    if (!window.authManager) {
        // Asegurarse de que AuthManager esté disponible
        if (typeof AuthManager !== 'undefined') {
            window.authManager = new AuthManager();
        } else {
            console.warn('⚠️ AuthManager no está disponible');
        }
    }
    
    // Luego inicializar el manager de artículo
    window.articuloManager = new ArticuloManager();
});