# Note-Cute - Aplicación de Notas Personalizables

## 1. Project Overview

**Nombre del proyecto:** Note-Cute  
**Tipo:** Aplicación web full-stack  
**Funcionalidad principal:** Una aplicación de notas personalizable con login, que permite crear notas con tablas tipo Excel, imágenes flotantes con capacidad de dibujar sobre ellas, y personalización visual completa.  
**Usuarios objetivo:** Usuarios que buscan una experiencia de notas rica y personalizada

## 2. Technical Stack

### Frontend
- **Framework:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Librerías:**
  - Luckysheet (para hojas de cálculo tipo Excel)
  - Fabric.js (para dibujar sobre imágenes)
  - Google Fonts (tipografías)
- **Almacenamiento:** LocalStorage + sincronización con backend

### Backend
- **Runtime:** Node.js con Express
- **Base de datos:** SQLite (simple, sin configuración)
- **Autenticación:** JWT (JSON Web Tokens)
- **Puerto:** 3000

## 3. UI/UX Specification

### Estructura de Pages

#### Login Page (`/login`)
- Formulario de login/registro
- Campos: email, contraseña
- Botón: "Iniciar Sesión" / "Registrarse"
- Diseño centrado, fondo animado

#### Dashboard Page (`/`)
- Barra lateral izquierda con lista de notas
- Área principal con la nota seleccionada
- Panel de personalización (colapsable)
- Header con logout y nombre de usuario

### Paleta de Colores
- **Primario:** `#6C5CE7` (morado suave)
- **Secundario:** `#A29BFE` (lavanda)
- **Acento:** `#FD79A8` (rosa)
- **Fondo defecto:** `#f0f2f5` (gris claro)
- **Nota defecto:** `#ffffff` (blanco)
- **Texto:** `#2d3436` (gris oscuro)
- **Éxito:** `#00b894`
- **Error:** `#d63031`

### Tipografía
- **Fuente principal:** 'Poppins', sans-serif
- **Tamaños:**
  - H1: 28px
  - H2: 22px
  - Body: 14px
  - Small: 12px

### Espaciado
- Padding base: 16px
- Margen entre notas: 12px
- Border-radius: 12px (notas), 8px (botones)

### Componentes UI

#### Sidebar
- Ancho: 280px
- Lista de notas con mini vista previa
- Botón "+ Nueva Nota"
- Scroll vertical

#### Nota Individual
- Título editable
- Contenido con editor rico
- Toolbar de herramientas
- Imágenes flotantes (arrastrables)
- Tablas Excel insertables
- Canvas para dibujar sobre imágenes

#### Panel de Personalización
- Color de fondo de la nota
- Color del borde
- Forma de las notas (border-radius)
- Tamaño de fuente
- Tipo de fuente (dropdown)
- Grosor del borde
- Sombra (on/off)
- Opacidad

#### Toolbar de Edición
- Bold, Italic, Underline, Strikethrough
- Highlight (resaltador)
- Tamaño de fuente
- Color de texto
- Alineación
- Listas (orden/no orden)
- Insertar tabla Excel
- Insertar imagen
- Modo dibujo (para dibujar sobre imágenes)

## 4. Functionality Specification

### Autenticación
- Registro de usuarios (email + contraseña)
- Login con JWT
- Sesión persistente (localStorage)
- Logout

### Gestión de Notas
- Crear nueva nota
- Editar nota (título y contenido)
- Eliminar nota
- Sincronización automática con backend
- Notas guardadas por usuario

### Editor de Contenido
- Editor de texto enriquecido (contenteditable)
- Toolbar de formatting (Word-like)
- **Tablas Excel:** Luckysheet embebido
- **Imágenes:**
  - Insertar desde URL o archivo local
  - Flotantes (position: absolute)
  - Arrastrables dentro de la nota
  - Redimensionables
- **Dibujo sobre imágenes:**
  - Activar modo dibujo
  - Dibujar con mouse/touch
  - Color y tamaño de brocha
  - Limpiar dibujo
  - Guardar dibujo como capa sobre la imagen

### Personalización
- **Fondo web:** color o imagen
- **Nota:**
  - Color de fondo
  - Color de borde
  - Forma (border-radius: 0-30px)
  - Tamaño (ancho: 300-800px)
  - Tipo de fuente
  - Tamaño de fuente (12-24px)
  - Borde (grosor 0-5px)
  - Sombra (on/off)
  - Opacidad (50-100%)

### Persistencia
- LocalStorage para modo offline
- Backend SQLite para persistencia
- Sincronización al iniciar sesión

## 5. API Endpoints

### Auth
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Notes
- `GET /api/notes` - Listar notas del usuario
- `POST /api/notes` - Crear nota
- `PUT /api/notes/:id` - Actualizar nota
- `DELETE /api/notes/:id` - Eliminar nota

### Settings
- `GET /api/settings` - Obtener preferencias
- `PUT /api/settings` - Guardar preferencias

## 6. File Structure

```
note-cute/
├── server/
│   ├── index.js          # Servidor Express
│   ├── database.js       # SQLite setup
│   ├── routes/
│   │   ├── auth.js       # Rutas auth
│   │   ├── notes.js      # Rutas notas
│   │   └── settings.js   # Rutas settings
│   └── package.json
├── public/
│   ├── index.html        # Login page
│   ├── dashboard.html   # Main app
│   ├── css/
│   │   └── styles.css    # All styles
│   └── js/
│       ├── app.js        # Main app logic
│       ├── auth.js       # Auth logic
│       ├── editor.js     # Note editor
│       ├── spreadsheet.js # Excel functionality
│       └── drawing.js    # Drawing on images
└── SPEC.md
```

## 7. Acceptance Criteria

- [ ] Usuario puede registrarse e iniciar sesión
- [ ] Dashboard muestra lista de notas del usuario
- [ ] Crear nueva nota funciona
- [ ] Editor de texto con toolbar (bold, italic, underline, highlight)
- [ ] Insertar tabla tipo Excel (Luckysheet)
- [ ] Insertar imágenes flotantes
- [ ] Dibujar sobre imágenes con Fabric.js
- [ ] Personalizar fondo de la web
- [ ] Personalizar color, forma, tamaño de notas
- [ ] Cambiar tipografía y tamaño de fuente
- [ ] Datos persisten en backend SQLite
- [ ] UI responsive y visualmente atractiva
