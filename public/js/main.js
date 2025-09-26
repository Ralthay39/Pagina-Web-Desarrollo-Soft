// main.js - Carga y muestra los artículos desde la API

class BlogManager {
    constructor() {
        this.articulos = [];
        this.init();
    }

    async init() {
        console.log('🔄 Inicializando blog...');
        await this.cargarArticulos();
        this.mostrarArticulos();
    }

    // Cargar artículos desde la API del backend
    async cargarArticulos() {
        try {
            console.log('📡 Cargando artículos desde el servidor...');
            const response = await fetch('/api/articulos');
            
            if (!response.ok) {
                throw new Error('Error al cargar artículos');
            }
            
            this.articulos = await response.json();
            console.log(`✅ ${this.articulos.length} artículos cargados`);
            
        } catch (error) {
            console.error('❌ Error:', error);
            this.mostrarError('No se pudieron cargar los artículos');
        }
    }

    // Mostrar artículos en el HTML
    mostrarArticulos() {
        const grid = document.getElementById('articulos');
        
        if (!grid) {
            console.error('❌ No se encontró el contenedor de artículos');
            return;
        }

        if (this.articulos.length === 0) {
            grid.innerHTML = `
                <div class="no-articulos">
                    <h3>📝 No hay artículos publicados aún</h3>
                    <p>Pronto tendremos contenido interesante para ti.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.articulos.map(articulo => this.crearCardArticulo(articulo)).join('');
    }

    // Crear HTML para cada artículo
    crearCardArticulo(articulo) {
        return `
            <article class="articulo-card" data-id="${articulo.id}">
                <div class="articulo-imagen">
                    ${articulo.imagen ? 
                        `<img src="${articulo.imagen}" alt="${articulo.titulo}">` : 
                        '📚'
                    }
                </div>
                <div class="articulo-contenido">
                    <span class="articulo-categoria">${articulo.categoria}</span>
                    <h3 class="articulo-titulo">${articulo.titulo}</h3>
                    <p class="articulo-resumen">${articulo.resumen}</p>
                    <div class="articulo-meta">
                        <span class="articulo-autor">👤 ${articulo.autor}</span>
                        <span class="articulo-fecha">📅 ${this.formatearFecha(articulo.fecha)}</span>
                    </div>
                    <a href="/articulo/${articulo.id}" class="btn-leer-mas">
                        Leer más
                    </a>
                </div>
            </article>
        `;
    }

    formatearFecha(fechaStr) {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Ver artículo individual (para implementar después)
    verArticulo(id) {
        console.log('Ver artículo:', id);
        // Esto lo implementaremos en el Sprint 3
        alert(`Próximamente: Vista individual del artículo ${id}`);
    }

    mostrarError(mensaje) {
        const grid = document.getElementById('articulos');
        if (grid) {
            grid.innerHTML = `
                <div class="error">
                    <h3>❌ Error</h3>
                    <p>${mensaje}</p>
                    <button onclick="blogManager.cargarArticulos()">Reintentar</button>
                </div>
            `;
        }
    }
}

// Inicializar cuando la página cargue
document.addEventListener('DOMContentLoaded', () => {
    window.blogManager = new BlogManager();
});

// Inicializar ambos managers
document.addEventListener('DOMContentLoaded', () => {
    window.blogManager = new BlogManager();
    // authManager se inicializa automáticamente en auth.js
});