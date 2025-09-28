// panel.js - Lógica del panel de usuario (redactores y admins)
class PanelManager {
    constructor() {
        this.articulos = [];
        this.authManager = null;
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

        // Cerrar modal haciendo clic fuera
        const modal = document.getElementById('modal-edicion');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.cerrarModalEdicion();
                }
            });
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
                console.log('📄 Primer artículo:', this.articulos[0]); // Debug
                
                // Filtrar artículos del usuario actual (a menos que sea admin)
                if (this.authManager.usuario.rol !== 'admin') {
                    this.articulos = this.articulos.filter(articulo => 
                        articulo.autor_id === this.authManager.usuario.id
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
        
        if (!contenedor) {
            console.error('❌ No se encontró el contenedor de artículos');
            return;
        }

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
            <div class="articulo-panel" data-id="${articulo.id}">
                <div class="articulo-panel-header">
                    <div class="articulo-panel-info">
                        <h3 class="articulo-panel-titulo">${articulo.titulo}</h3>
                        <div class="articulo-panel-meta">
                            <span class="categoria-badge">${articulo.categoria}</span>
                            <span class="fecha">📅 ${articulo.fecha_publicacion}</span>
                            <span class="autor">👤 ${articulo.autor || articulo.autor_nombre}</span>
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
                    resumen: resumen || contenido.substring(0, 150) + '...'
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.mostrarMensaje('✅ Artículo creado exitosamente', 'success');
                this.limpiarFormularioNuevo();
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
        if (!articulo) {
            this.mostrarMensaje('❌ Artículo no encontrado', 'error');
            return;
        }

        // Llenar formulario de edición
        document.getElementById('editar-id').value = articulo.id;
        document.getElementById('editar-titulo').value = articulo.titulo;
        document.getElementById('editar-categoria').value = articulo.categoria;
        document.getElementById('editar-resumen').value = articulo.resumen || '';
        document.getElementById('editar-contenido').value = articulo.contenido;

        // Mostrar modal
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

        if (!titulo || !contenido || !categoria) {
            this.mostrarMensaje('❌ Todos los campos obligatorios deben ser completados', 'error');
            return;
        }

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
                    resumen: resumen || contenido.substring(0, 150) + '...'
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.mostrarMensaje('✅ Artículo actualizado exitosamente', 'success');
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
        if (!confirm('¿Estás seguro de que quieres eliminar este artículo? \n\nEsta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`/api/articulos/${articuloId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.mostrarMensaje('✅ Artículo eliminado exitosamente', 'success');
                await this.cargarArticulos();
                this.mostrarMisArticulos();
            } else {
                const data = await response.json();
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
        if (!contenedor) return;
        
        const totalArticulos = this.articulos.length;
        const misArticulos = this.articulos.filter(a => 
            a.autor_id === this.authManager.usuario.id
        ).length;
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
    actualizarContadorCaracteres() {
        const resumen = document.getElementById('resumen');
        const contador = document.getElementById('contador-resumen');
        
        if (resumen && contador) {
            contador.textContent = `${resumen.value.length}/300 caracteres`;
        }
    }

    mostrarMensaje(mensaje, tipo) {
        // Reutilizar la función del authManager si existe
        if (this.authManager && this.authManager.mostrarMensaje) {
            this.authManager.mostrarMensaje(mensaje, tipo);
            return;
        }

        // Fallback: crear mensaje básico
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
        `;

        if (tipo === 'success') {
            mensajeDiv.style.background = '#27ae60';
        } else {
            mensajeDiv.style.background = '#e74c3c';
        }

        document.body.appendChild(mensajeDiv);

        setTimeout(() => {
            if (mensajeDiv.parentNode) {
                mensajeDiv.parentNode.removeChild(mensajeDiv);
            }
        }, 5000);
    }

    mostrarError(mensaje) {
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div class="mensaje-error" style="text-align: center; padding: 2rem;">
                    <h2>❌ Error</h2>
                    <p>${mensaje}</p>
                    <a href="/" style="color: #3498db;">Volver al inicio</a>
                </div>
            `;
        }
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando panel...');
    
    window.panelManager = new PanelManager();
    
    setTimeout(async () => {
        try {
            await window.panelManager.init();
        } catch (error) {
            console.error('Error inicializando panel:', error);
        }
    }, 100);
});