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
            console.log('📊 Primer artículo:', this.articulos[0]); // Para debug
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
        console.log('📄 Procesando artículo:', articulo); // Para debug
        
        return `
            <article class="articulo-card" data-id="${articulo.id}">
                <div class="articulo-imagen">
                    ${articulo.imagen && articulo.imagen !== '/images/placeholder.jpg' ? 
                        `<img src="${articulo.imagen}" alt="${articulo.titulo}">` : 
                        '<div class="placeholder-imagen">📚</div>'
                    }
                </div>
                <div class="articulo-contenido">
                    <span class="articulo-categoria">${articulo.categoria}</span>
                    <h3 class="articulo-titulo">${articulo.titulo}</h3>
                    <p class="articulo-resumen">${articulo.resumen}</p>
                    <div class="articulo-meta">
                        <span class="articulo-autor">👤 ${articulo.autor || articulo.autor_nombre}</span>
                        <span class="articulo-fecha">📅 ${articulo.fecha_publicacion}</span>
                    </div>
                    <a href="/articulo/${articulo.id}" class="btn-leer-mas">
                        Leer más
                    </a>
                </div>
            </article>
        `;
    }

    // Ver artículo individual
    verArticulo(id) {
        console.log('Ver artículo:', id);
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