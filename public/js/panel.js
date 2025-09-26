// panel.js - VERSIÓN CORREGIDA (con inicialización asíncrona)
class PanelManager {
    constructor() {
        this.articulos = [];
        this.authManager = null;
        // No inicializar aquí - esperar a que auth esté listo
    }

    async init() {
        console.log('🔄 Inicializando PanelManager...');
        
        // Esperar a que authManager esté disponible
        await this.esperarAuthManager();
        
        console.log('🔐 AuthManager disponible:', this.authManager);
        console.log('👤 Usuario:', this.authManager.usuario);

        // Verificar autenticación y permisos
        if (!this.authManager || !this.authManager.usuario) {
            this.mostrarError('Debes iniciar sesión para acceder al panel');
            return;
        }

        if (!['redactor', 'admin'].includes(this.authManager.usuario.rol)) {
            this.mostrarError('No tienes permisos para acceder al panel');
            return;
        }

        console.log('✅ Acceso al panel permitido');

        // Configurar eventos
        this.configurarEventos();
        
        // Cargar datos iniciales
        await this.cargarArticulos();
        this.mostrarSeccion('mis-articulos');
    }

    // Esperar a que authManager esté listo
    async esperarAuthManager() {
        return new Promise((resolve) => {
            const checkAuthManager = () => {
                if (window.authManager && window.authManager.usuario !== undefined) {
                    this.authManager = window.authManager;
                    console.log('✅ AuthManager cargado correctamente');
                    resolve();
                } else {
                    console.log('⏳ Esperando authManager...');
                    setTimeout(checkAuthManager, 100);
                }
            };
            checkAuthManager();
        });
    }

    configurarEventos() {
        // Navegación entre secciones
        document.querySelectorAll('.nav-panel-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const seccionId = item.getAttribute('data-seccion');
                this.mostrarSeccion(seccionId);
            });
        });

        // Formulario nuevo artículo
        const formNuevo = document.getElementById('form-nuevo-articulo');
        if (formNuevo) {
            formNuevo.onsubmit = (e) => this.crearArticulo(e);
        }

        // Formulario editar artículo
        const formEditar = document.getElementById('form-editar-articulo');
        if (formEditar) {
            formEditar.onsubmit = (e) => this.editarArticulo(e);
        }

        // Botón cerrar modal
        const btnCerrarModal = document.querySelector('.close-modal');
        if (btnCerrarModal) {
            btnCerrarModal.onclick = () => this.cerrarModalEdicion();
        }

        // Contador de caracteres para resumen
        const resumenInput = document.getElementById('resumen');
        if (resumenInput) {
            resumenInput.addEventListener('input', () => this.actualizarContadorCaracteres());
        }
    }

    // Navegación entre secciones
    mostrarSeccion(seccionId) {
        console.log('📁 Mostrando sección:', seccionId);
        
        // Ocultar todas las secciones
        document.querySelectorAll('.seccion-panel').forEach(seccion => {
            seccion.style.display = 'none';
        });

        // Remover activo de todos los items de nav
        document.querySelectorAll('.nav-panel-item').forEach(item => {
            item.classList.remove('active');
        });

        // Mostrar la sección seleccionada
        const seccion = document.getElementById(seccionId);
        if (seccion) {
            seccion.style.display = 'block';
        }

        // Activar el item de nav correspondiente
        const navItem = document.querySelector(`[data-seccion="${seccionId}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        // Cargar datos específicos de la sección
        if (seccionId === 'mis-articulos') {
            this.mostrarMisArticulos();
        } else if (seccionId === 'estadisticas') {
            this.mostrarEstadisticas();
        } else if (seccionId === 'nuevo-articulo') {
            this.limpiarFormularioNuevo();
        }
    }

    // Cargar artículos del usuario
    async cargarArticulos() {
        try {
            console.log('📥 Cargando artículos...');
            const response = await fetch('/api/articulos');
            if (response.ok) {
                this.articulos = await response.json();
                console.log(`✅ ${this.articulos.length} artículos cargados`);
                
                // Filtrar artículos del usuario actual (a menos que sea admin)
                if (this.authManager.usuario.rol !== 'admin') {
                    this.articulos = this.articulos.filter(articulo => 
                        articulo.autor === this.authManager.usuario.nombre
                    );
                    console.log(`👤 ${this.articulos.length} artículos del usuario`);
                }
            } else {
                console.error('❌ Error cargando artículos:', response.status);
            }
        } catch (error) {
            console.error('❌ Error cargando artículos:', error);
        }
    }

    // Mostrar artículos del usuario
    mostrarMisArticulos() {
        const contenedor = document.getElementById('lista-mis-articulos');
        
        if (!this.articulos || this.articulos.length === 0) {
            contenedor.innerHTML = `
                <div class="no-articulos">
                    <h3>📝 Aún no tienes artículos publicados</h3>
                    <p>Crea tu primer artículo usando el formulario de "Nuevo Artículo".</p>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = this.articulos.map(articulo => `
            <div class="articulo-panel">
                <div class="articulo-panel-header">
                    <div class="articulo-panel-info">
                        <h3 class="articulo-panel-titulo">${articulo.titulo}</h3>
                        <div class="articulo-panel-meta">
                            <span class="categoria-badge">${articulo.categoriaDisplay || articulo.categoria}</span>
                            <span class="fecha">📅 ${this.formatearFecha(articulo.fecha)}</span>
                            <span class="autor">👤 ${articulo.autor}</span>
                        </div>
                        <p class="articulo-panel-resumen">${articulo.resumen}</p>
                    </div>
                    <div class="articulo-panel-acciones">
                        <a href="/articulo/${articulo.id}" class="btn-accion btn-ver" target="_blank">👁️ Ver</a>
                        <button class="btn-accion btn-editar" onclick="panelManager.abrirModalEdicion(${articulo.id})">
                            ✏️ Editar
                        </button>
                        <button class="btn-accion btn-eliminar" onclick="panelManager.eliminarArticulo(${articulo.id})">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Crear nuevo artículo
    async crearArticulo(event) {
        event.preventDefault();
        console.log('📝 Creando nuevo artículo...');
        
        const titulo = document.getElementById('titulo').value.trim();
        const contenido = document.getElementById('contenido').value.trim();
        const categoria = document.getElementById('categoria').value;
        const resumen = document.getElementById('resumen').value.trim();

        if (!titulo || !contenido || !categoria) {
            this.mostrarMensaje('❌ Todos los campos obligatorios deben ser completados', 'error');
            return;
        }

        try {
            const response = await fetch('/api/articulos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    titulo,
                    contenido,
                    categoria,
                    resumen: resumen || titulo.substring(0, 150) + '...', // Resumen automático si está vacío
                    autor: this.authManager.usuario.nombre
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.mostrarMensaje('✅ Artículo creado exitosamente', 'exito');
                // Limpiar formulario
                this.limpiarFormularioNuevo();
                // Recargar artículos
                await this.cargarArticulos();
                this.mostrarSeccion('mis-articulos');
            } else {
                this.mostrarMensaje(`❌ ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Error creando artículo:', error);
            this.mostrarMensaje('❌ Error de conexión', 'error');
        }
    }

    limpiarFormularioNuevo() {
        const form = document.getElementById('form-nuevo-articulo');
        if (form) form.reset();
        this.actualizarContadorCaracteres();
    }

    // Abrir modal de edición
    abrirModalEdicion(articuloId) {
        console.log('✏️ Abriendo edición para artículo:', articuloId);
        const articulo = this.articulos.find(a => a.id === articuloId);
        if (!articulo) return;

        document.getElementById('editar-id').value = articulo.id;
        document.getElementById('editar-titulo').value = articulo.titulo;
        document.getElementById('editar-categoria').value = articulo.categoria;
        document.getElementById('editar-resumen').value = articulo.resumen || '';
        document.getElementById('editar-contenido').value = articulo.contenido;

        document.getElementById('modal-edicion').style.display = 'block';
    }

    // Cerrar modal de edición
    cerrarModalEdicion() {
        document.getElementById('modal-edicion').style.display = 'none';
    }

    // Editar artículo
    async editarArticulo(event) {
        event.preventDefault();
        console.log('💾 Guardando edición...');
        
        const articuloId = document.getElementById('editar-id').value;
        const titulo = document.getElementById('editar-titulo').value.trim();
        const contenido = document.getElementById('editar-contenido').value.trim();
        const categoria = document.getElementById('editar-categoria').value;
        const resumen = document.getElementById('editar-resumen').value.trim();

        try {
            const response = await fetch(`/api/articulos/${articuloId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    titulo,
                    contenido,
                    categoria,
                    resumen: resumen || null
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.mostrarMensaje('✅ Artículo actualizado exitosamente', 'exito');
                this.cerrarModalEdicion();
                await this.cargarArticulos();
                this.mostrarMisArticulos();
            } else {
                this.mostrarMensaje(`❌ ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Error editando artículo:', error);
            this.mostrarMensaje('❌ Error de conexión', 'error');
        }
    }

    // Eliminar artículo
    async eliminarArticulo(articuloId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este artículo? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`/api/articulos/${articuloId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                this.mostrarMensaje('✅ Artículo eliminado exitosamente', 'exito');
                await this.cargarArticulos();
                this.mostrarMisArticulos();
            } else {
                this.mostrarMensaje(`❌ ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Error eliminando artículo:', error);
            this.mostrarMensaje('❌ Error de conexión', 'error');
        }
    }

    // Mostrar estadísticas
    mostrarEstadisticas() {
        const contenedor = document.getElementById('contenido-estadisticas');
        
        const totalArticulos = this.articulos.length;
        const misArticulos = this.articulos.filter(a => a.autor === this.authManager.usuario.nombre).length;
        const categorias = [...new Set(this.articulos.map(a => a.categoria))].length;

        contenedor.innerHTML = `
            <div class="estadisticas-grid">
                <div class="tarjeta-estadistica">
                    <div class="numero">${totalArticulos}</div>
                    <div class="etiqueta">Total de Artículos</div>
                </div>
                <div class="tarjeta-estadistica">
                    <div class="numero">${misArticulos}</div>
                    <div class="etiqueta">Mis Artículos</div>
                </div>
                <div class="tarjeta-estadistica">
                    <div class="numero">${categorias}</div>
                    <div class="etiqueta">Categorías</div>
                </div>
            </div>
        `;
    }

    // Utilidades
    formatearFecha(fechaStr) {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-ES');
    }

    actualizarContadorCaracteres() {
        const resumen = document.getElementById('resumen');
        const contador = document.getElementById('contador-resumen');
        
        if (resumen && contador) {
            contador.textContent = `${resumen.value.length}/300 caracteres`;
        }
    }

    mostrarMensaje(mensaje, tipo) {
        // Eliminar mensajes anteriores
        const mensajesAnteriores = document.querySelectorAll('.mensaje-flotante');
        mensajesAnteriores.forEach(msg => msg.remove());

        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje-flotante ${tipo}`;
        mensajeDiv.textContent = mensaje;
        mensajeDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            font-weight: bold;
            animation: slideInRight 0.3s ease-out;
        `;

        if (tipo === 'exito') {
            mensajeDiv.style.background = '#27ae60';
        } else {
            mensajeDiv.style.background = '#e74c3c';
        }

        document.body.appendChild(mensajeDiv);

        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            mensajeDiv.remove();
        }, 5000);
    }

    mostrarError(mensaje) {
        const main = document.querySelector('.main .container');
        main.innerHTML = `
            <div class="mensaje-error" style="text-align: center; padding: 2rem;">
                <h2>❌ Error</h2>
                <p>${mensaje}</p>
                <a href="/" style="color: #3498db;">Volver al inicio</a>
            </div>
        `;
    }
}

// Inicialización CORREGIDA - Esperar a que todo esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando panel...');
    
    // Crear instancia pero no inicializar aún
    window.panelManager = new PanelManager();
    
    // Esperar un momento para que auth.js se inicialice
    setTimeout(async () => {
        try {
            await window.panelManager.init();
        } catch (error) {
            console.error('Error inicializando panel:', error);
        }
    }, 100);
});