// auth.js - VERSIÓN COMPLETA CORREGIDA CON INTEGRACIÓN DE PANEL MEJORADA
class AuthManager {
    constructor() {
        this.usuario = null;
        this.init();
    }

    async init() {
        await this.verificarSesion();
        this.actualizarInterfaz();
        this.configurarEventos();
    }

    async verificarSesion() {
        try {
            const response = await fetch('/api/usuario-actual');
            const data = await response.json();
            
            if (data.usuario) {
                this.usuario = data.usuario;
                console.log('✅ Sesión activa:', this.usuario.email);
            }
        } catch (error) {
            console.error('❌ Error verificando sesión:', error);
        }
    }

    showLogin() {
        if (document.getElementById('login-form')) {
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('auth-modal').style.display = 'block';
        } else {
            console.warn('⚠️ Modal de login no disponible en esta página');
        }
    }

    showRegister() {
        if (document.getElementById('register-form')) {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
            document.getElementById('auth-modal').style.display = 'block';
        } else {
            console.warn('⚠️ Modal de registro no disponible en esta página');
        }
    }

    closeModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'none';
        }
    }

    async login(event) {
        if (event) event.preventDefault();
        
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        
        if (!emailInput || !passwordInput) {
            this.mostrarMensaje('❌ Formulario de login no disponible', 'error');
            return;
        }

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.usuario = data.usuario;
                this.actualizarInterfaz();
                this.closeModal();
                this.mostrarMensaje(`✅ Bienvenido, ${data.usuario.nombre}!`, 'success');
                
                //  Recargar la página si estamos en el panel para actualizar permisos
                if (window.location.pathname === '/panel' || window.location.pathname.includes('panel')) {
                    window.location.reload();
                }
            } else {
                this.mostrarMensaje(`❌ ${data.error}`, 'error');
            }
        } catch (error) {
            this.mostrarMensaje('❌ Error de conexión', 'error');
        }
    }

    async register(event) {
        if (event) event.preventDefault();
        
        const nombreInput = document.getElementById('register-nombre');
        const emailInput = document.getElementById('register-email');
        const passwordInput = document.getElementById('register-password');
        const codigoInput = document.getElementById('register-codigo');
        
        if (!nombreInput || !emailInput || !passwordInput) {
            this.mostrarMensaje('❌ Formulario de registro no disponible', 'error');
            return;
        }

        const nombre = nombreInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        const codigoInvitacion = codigoInput ? codigoInput.value : '';

        //  Validación de Correo institucional
        if (!email.endsWith('@unihumboldt.edu.ve')) {
            this.mostrarMensaje('❌ Solo se permiten correos institucionales (@unihumboldt.edu.ve)', 'error');
            return;
        }

        try {
            const response = await fetch('/api/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, password, codigoInvitacion })
            });

            const data = await response.json();

            if (response.ok) {
                this.usuario = data.usuario;
                this.actualizarInterfaz();
                this.closeModal();
                this.mostrarMensaje(`🎉 ${data.mensaje}`, 'success');
            } else {
                this.mostrarMensaje(`❌ ${data.error}`, 'error');
            }
        } catch (error) {
            this.mostrarMensaje('❌ Error de conexión', 'error');
        }
    }

    async logout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            this.usuario = null;
            this.actualizarInterfaz();
            this.mostrarMensaje('👋 Sesión cerrada', 'info');
            
            //  Redirigir a inicio si estamos en el panel
            if (window.location.pathname === '/panel' || window.location.pathname.includes('panel')) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error en logout:', error);
        }
    }

    actualizarInterfaz() {
        const userBar = document.getElementById('user-bar');
        const userInfo = document.getElementById('user-info');
        const nav = document.querySelector('.nav');
        const navLogin = document.querySelector('.nav-login');
        const navPanel = document.querySelector('.nav-panel');

        if (userBar && userInfo) {
            if (this.usuario) {
                userBar.style.display = 'block';
                userInfo.innerHTML = `👤 ${this.usuario.nombre} (${this.usuario.rol}) ${this.usuario.rol === 'admin' ? '👑' : ''}${this.usuario.rol === 'redactor' ? '✍️' : ''}`;

                //  Manejo del enlace Panel en la navegación
                if (nav) {
                    // Ocultar enlace de Login
                    if (navLogin) {
                        navLogin.style.display = 'none';
                    }
                    
                    // Mostrar enlace Panel solo para admins y redactores
                    if (['admin', 'redactor'].includes(this.usuario.rol)) {
                        if (navPanel) {
                            // Si ya existe el enlace Panel, mostrarlo
                            navPanel.style.display = 'inline-block';
                        } else {
                            // Si no existe, crearlo y agregarlo
                            this.crearEnlacePanel(nav);
                        }
                    } else {
                        // Ocultar Panel si el usuario no tiene permisos
                        if (navPanel) {
                            navPanel.style.display = 'none';
                        }
                    }
                }
            } else {
                //  Usuario no logeado - restaurar estado inicial
                userBar.style.display = 'none';
                
                if (nav) {
                    // Mostrar enlace de Login
                    if (navLogin) {
                        navLogin.style.display = 'inline-block';
                    }
                    
                    // Ocultar enlace Panel
                    if (navPanel) {
                        navPanel.style.display = 'none';
                    }
                }
            }
        }
    }

    //  Función para crear el enlace Panel dinámicamente
    crearEnlacePanel(nav) {
        const panelLink = document.createElement('a');
        panelLink.href = '/panel.html';
        panelLink.className = 'nav-panel';
        panelLink.innerHTML = '⚙️ Panel';
        panelLink.title = 'Panel de Administración';
        
        // Insertar antes del enlace Login
        const navLogin = document.querySelector('.nav-login');
        if (navLogin) {
            nav.insertBefore(panelLink, navLogin);
        } else {
            nav.appendChild(panelLink);
        }
    }

    configurarEventos() {
        //  Solo configurar eventos si los elementos existen
        const closeButton = document.querySelector('.close');
        const authModal = document.getElementById('auth-modal');
        
        if (closeButton && authModal) {
            closeButton.onclick = () => this.closeModal();
            authModal.onclick = (event) => {
                if (event.target.id === 'auth-modal') this.closeModal();
            };
        }

        //  Configurar evento para tecla Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    mostrarMensaje(mensaje, tipo) {
        //  Crear notificación temporal estilo toast
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        notification.textContent = mensaje;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            font-weight: bold;
            font-family: 'Open Sans', sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;

        //  Colores según el tipo de mensaje usando la paleta de la universidad
        if (tipo === 'success') notification.style.background = '#27ae60'; // Verde éxito
        if (tipo === 'error') notification.style.background = '#e74c3c';   // Rojo error
        if (tipo === 'info') notification.style.background = '#3498db';    // Azul info

        //  Agregar estilos de animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        //  Remover automáticamente después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    //  Función auxiliar para verificar permisos de panel
    tieneAccesoPanel() {
        return this.usuario && ['admin', 'redactor'].includes(this.usuario.rol);
    }

    //  Función para redirigir al panel si tiene permisos
    irAlPanel() {
        if (this.tieneAccesoPanel()) {
            window.location.href = '/panel.html';
        } else {
            this.mostrarMensaje('❌ No tienes permisos para acceder al panel', 'error');
        }
    }
}

//  Inicialización segura con verificación de errores
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.authManager = new AuthManager();
        console.log('✅ AuthManager inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando AuthManager:', error);
    }
});

//  Exportar para uso en otros módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}