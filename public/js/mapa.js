// mapa.js
class MapaManager {
    constructor() {
        this.mapa = null;
        this.marcador = null;
        this.infoUniversidad = null;
        this.init();
    }

    async init() {
        await this.cargarInformacionUniversidad();
        await this.cargarLeaflet();
    }

    async cargarInformacionUniversidad() {
        try {
            const response = await fetch('/api/universidad');
            this.infoUniversidad = await response.json();
            
            // Actualizar información en el footer
            document.getElementById('footer-direccion').textContent = this.infoUniversidad.direccion;
            document.getElementById('footer-telefono').textContent = this.infoUniversidad.telefono;
            document.getElementById('footer-email').textContent = this.infoUniversidad.email;
            
        } catch (error) {
            console.error('Error cargando información de la universidad:', error);
        }
    }

    // Leaflet
    cargarLeaflet() {
        return new Promise((resolve, reject) => {
            if (window.L) {
                this.inicializarMapa();
                resolve();
                return;
            }

            // Cargar CSS de Leaflet
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            document.head.appendChild(link);

            // Cargar JS de Leaflet
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            script.onload = () => {
                this.inicializarMapa();
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Inicializar el mapa de Leaflet
    inicializarMapa() {
        if (!this.infoUniversidad) {
            console.error('Información de universidad no disponible');
            return;
        }

        const ubicacion = [this.infoUniversidad.ubicacion.lat, this.infoUniversidad.ubicacion.lng];
        
        // Crear mapa Leaflet
        this.mapa = L.map('footer-mapa').setView(ubicacion, 14);

        // Añadir capa de tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18,
        }).addTo(this.mapa);

        // Icono personalizado para el marcador
        const iconoUniversidad = L.divIcon({
            className: 'icono-universidad',
            html: `
                <div style="
                    background: #e74c3c;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    border: 3px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                ">U</div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        // Marcador con popup
        this.marcador = L.marker(ubicacion, { icon: iconoUniversidad })
            .addTo(this.mapa)
            .bindPopup(this.crearPopupContent(), {
                className: 'popup-universidad',
                maxWidth: 300
            })
            .openPopup();

        console.log('🗺️ Mapa Leaflet inicializado correctamente');
    }

    // Contenido del popup
    crearPopupContent() {
        return `
            <div style="padding: 1rem; max-width: 280px; font-family: Arial, sans-serif;">
                <h4 style="margin: 0 0 0.5rem 0; color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 0.3rem;">
                    🏫 ${this.infoUniversidad.nombre}
                </h4>
                
                <div style="font-size: 0.9rem; line-height: 1.4;">
                    <p style="margin: 0.3rem 0; color: #7f8c8d;">
                        📍 ${this.infoUniversidad.direccion}
                    </p>
                    
                    <p style="margin: 0.3rem 0;">
                        <strong>📞 Teléfono:</strong><br>
                        ${this.infoUniversidad.telefono}
                    </p>
                    
                    <p style="margin: 0.3rem 0;">
                        <strong>💬 WhatsApp:</strong><br>
                        ${this.infoUniversidad.whatsapp}
                    </p>
                    
                    <p style="margin: 0.3rem 0;">
                        <strong>📧 Email:</strong><br>
                        ${this.infoUniversidad.email}
                    </p>
                    
                    <p style="margin: 0.5rem 0 0 0; font-style: italic; color: #95a5a6;">
                        "${this.infoUniversidad.descripcion}"
                    </p>

                    <div style="margin-top: 0.8rem; text-align: center;">
                        <button onclick="mapaManager.obtenerDireccion()" 
                                style="background: #3498db; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin: 0.2rem;">
                            🚗 Cómo llegar
                        </button>
                        <button onclick="mapaManager.compartirUbicacion()" 
                                style="background: #2ecc71; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin: 0.2rem;">
                            📤 Compartir
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Función para abrir direcciones en OpenStreetMap
    obtenerDireccion() {
        if (!this.infoUniversidad) return;
        
        const lat = this.infoUniversidad.ubicacion.lat;
        const lng = this.infoUniversidad.ubicacion.lng;
        
                const url = `https://www.openstreetmap.org/directions?from=&to=${lat},${lng}#map=15/${lat}/${lng}`;
        window.open(url, '_blank');
    }

    // Función para compartir ubicación
    compartirUbicacion() {
        if (!this.infoUniversidad) return;
        
        const texto = `Visita la ${this.infoUniversidad.nombre} - ${this.infoUniversidad.direccion}`;
        
        const url = `https://www.openstreetmap.org/#map=15/${this.infoUniversidad.ubicacion.lat}/${this.infoUniversidad.ubicacion.lng}`;
        
        if (navigator.share) {
            navigator.share({
                title: this.infoUniversidad.nombre,
                text: texto,
                url: url
            });
        } else {
            navigator.clipboard.writeText(`${texto} ${url}`).then(() => {
                this.mostrarNotificacion('📍 Ubicación copiada al portapapeles');
            });
        }
    }

    // Notificación simple
    mostrarNotificacion(mensaje) {
        const notification = document.createElement('div');
        notification.textContent = mensaje;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 1000;
            font-size: 0.9rem;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
}

// Inicializar el mapa cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.mapaManager = new MapaManager();
});