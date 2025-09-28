# Pagina-Web-Desarrollo-Soft

# Blog Universitario - Sistema de Gestión de Contenidos

Pagina Web desarrollada bajo la premisa de gestión de artículos académicos desarrollado para la Universidad Alejandro de Humboldt. Incluye autenticación de usuarios, roles de permisos, panel de administración y base de datos SQLite.

## Características

- Gestión de Artículos: Crear, editar, eliminar y publicar artículos
- Sistema de Usuarios: Registro y autenticación segu
- Roles de Acceso: Admin, Redactor y View
- Base de Datos: SQLite con persistencia de datos
- Autenticación Segura: Contraseñas encriptadas con bcrypt

## Prerrequisitos

- Node.js (versión 14 o superior)
- npm (incluido con Node.js)

## Instalación

- 1. Clonar o descargar el proyecto

- 2. Instalar dependencias

npm install express bcrypt express-session sqlite3

## Ruta para abrir en el navegador

http://localhost:3000


### Usuarios de Prueba
El sistema incluye usuarios predefinidos:

## Administrador
Correo: admin@unihumboldt.edu.ve
Contraseña: admin123
Permisos: Acceso total al sistema

## Redactor
Correo: profesor@unihumboldt.edu.ve
Contraseña: profesor123
Permisos: Crear y gestionar artículos propios

## Usuario de Prueba
Correo: prueba@unihumboldt.edu.ve
Contraseña: prueba123
Premisos: Ver y comentar artículos


### Códigos de Invitación
Al momento de registrarse se puede usar un código opcional para obtener roles específicos:

- ADMIN-2025: Rol de Administrador
- REDACTOR-2025: Rol de Redactor
- Sin código: Rol de Usuario (lector)


### Tecnologías Utilizadas
- Backend: Node.js + Express.js
- Base de Datos: SQLite3
- Frontend: HTML5, CSS3, JavaScript vanilla
- Autenticación: Express-session + bcrypt
- Seguridad: Validación de inputs
