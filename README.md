# Chile en Línea - Foro Comunitario

Aplicación de foro web moderna construida con NestJS, Prisma y PostgreSQL, con un diseño inspirado en MyBB.

## 🚀 Características

### Core
- ✨ Interfaz inspirada en MyBB con diseño moderno
- 📝 Creación y visualización de threads y comentarios
- 👤 Sistema de usuarios con perfiles completos
- 💬 Categorías organizadas
- 🎨 Editor BBCode con emojis
- 📊 Estadísticas en tiempo real
- 🔍 SEO-friendly con slugs únicos
- ⚡ Optimizado para rendimiento

### Autenticación y Seguridad
- 🔐 Autenticación JWT con cookies HttpOnly
- 🛡️ Guards protegiendo endpoints sensibles
- 🔑 Sistema de registro y login
- 👮 Validación de permisos por grupo

### Sistema de Grupos
- 👥 7 grupos de usuario predefinidos (Invitados, Registrados, Moderadores, Administradores, etc.)
- 🎨 Colores personalizados por grupo
- 👑 Gestión de grupos exclusiva para administradores
- 🏷️ Badges de grupo en toda la aplicación

### Sistema de Avatares
- 🖼️ Upload de avatares (JPG, PNG, GIF, WEBP)
- ✂️ Redimensionamiento automático a 200x200px con Sharp
- 🗑️ Eliminación de avatares propios
- 💾 Almacenamiento en filesystem con servicio estático
- 🔄 Fallback a iniciales del usuario

### Sistema de Reputación
- ⭐ Evaluación de usuarios (Positivo +1, Neutral 0, Negativo -1)
- 📝 Comentarios opcionales en reputaciones
- 📊 Estadísticas por periodo (última semana, mes, 6 meses)
- 📄 Reporte completo de reputación estilo MyBB
- 🗑️ Eliminación de reputaciones propias
- 🚫 Validación anti-auto-reputación

### Perfiles y Miembros
- 👤 Perfiles de usuario completos con estadísticas
- 📋 Lista de miembros paginada
- 📈 Estadísticas detalladas (posts, threads, reputación)
- 🕒 Última visita y fecha de registro
- 📜 Threads recientes del usuario

## 🛠️ Tecnologías

### Backend
- **NestJS 10.x** - Framework Node.js progresivo
- **Prisma ORM** - ORM moderno para TypeScript
- **PostgreSQL** - Base de datos relacional
- **TypeScript** - Tipado estático
- **Passport.js** - Autenticación (Local + JWT)
- **bcrypt** - Hashing de contraseñas
- **Multer** - Upload de archivos
- **Sharp** - Procesamiento de imágenes

### Frontend
- **HTML5/CSS3** - Estructura y estilos
- **JavaScript Vanilla** - Interactividad sin frameworks
- **Fetch API** - Comunicación con backend
- **HttpOnly Cookies** - Gestión segura de tokens JWT

## 📋 Requisitos Previos

- Node.js 16.x o superior
- PostgreSQL 12.x o superior
- npm o yarn

## 🔧 Instalación

1. **Clonar repositorio e instalar dependencias**
```bash
git clone <repository-url>
cd chile-en-linea
npm install
```

2. **Configurar variables de entorno**

Crear archivo `.env` en la raíz:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/chile_foro"
JWT_SECRET="tu_secreto_jwt_super_seguro_aqui"
```

3. **Configurar base de datos**
```bash
# Crear base de datos PostgreSQL
createdb chile_foro

# Ejecutar migraciones
npx prisma migrate deploy

# Generar cliente Prisma
npx prisma generate
```

4. **Insertar grupos de usuario iniciales**

Ejecutar en DBeaver o psql:
```sql
INSERT INTO "UserGroup" (id, name, description, "order", color, "isDefault", "createdAt", "updatedAt") VALUES
(1, 'Invitados', 'Usuarios no registrados', 1, '#000000', false, NOW(), NOW()),
(2, 'Registrados', 'Usuarios registrados normales', 2, '#0066CC', true, NOW(), NOW()),
(3, 'Super Moderadores', 'Super moderadores del foro', 3, '#CC0000', false, NOW(), NOW()),
(4, 'Administradores', 'Administradores del foro', 4, '#FF0000', false, NOW(), NOW()),
(5, 'Esperando Activación', 'Usuarios pendientes de activación', 5, '#999999', false, NOW(), NOW()),
(6, 'Moderadores', 'Moderadores del foro', 6, '#009900', false, NOW(), NOW()),
(7, 'Baneados', 'Usuarios baneados', 7, '#666666', false, NOW(), NOW());
```

## 🚀 Ejecución

### Desarrollo
```bash
npm run start:dev
```

La aplicación estará disponible en `http://localhost:3000`

### Producción
```bash
npm run build
npm run start:prod
```

## 📁 Estructura del Proyecto

```
chile-en-linea/
├── src/
│   ├── auth/              # Módulo de autenticación (JWT, Passport)
│   ├── app.controller.ts  # Controladores principales
│   ├── app.service.ts     # Lógica de negocio
│   ├── avatar.service.ts  # Servicio de gestión de avatares
│   ├── prisma.service.ts  # Cliente Prisma
│   └── main.ts            # Entry point
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   └── migrations/        # Migraciones
├── public/
│   ├── index.html         # Página principal
│   ├── category.html      # Listado de threads
│   ├── thread.html        # Vista de thread
│   ├── new-thread.html    # Crear thread
│   ├── members.html       # Lista de miembros
│   ├── profile.html       # Perfil de usuario
│   ├── groups.html        # Gestión de grupos
│   ├── reputation.html    # Reporte de reputación
│   ├── login.html         # Login
│   ├── register.html      # Registro
│   ├── styles.css         # Estilos globales
│   ├── auth.js            # Gestión de autenticación frontend
│   └── uploads/
│       └── avatars/       # Avatares de usuarios
└── README.md
```

## 🗄️ Modelo de Datos

### User
- Información básica (email, username, password hasheado)
- Avatar (path relativo)
- Relación con UserGroup
- Timestamps (createdAt, lastLoginAt)

### UserGroup
- 7 grupos predefinidos con colores
- isDefault para grupo de nuevos usuarios
- Orden de visualización

### Post
- Thread principal con título, slug, contenido
- Flags: isPinned, isLocked
- Contador de vistas
- Relación con Category y User (autor)

### Comment
- Respuestas a threads
- Relación con Post y User (autor)

### Reputation
- Sistema +1/0/-1 (positive/neutral/negative)
- Comentario opcional
- Relación bidireccional con User (from/to)

### Like
- Sistema de "me gusta" en posts
- Unique constraint por user-post

## 🎨 Grupos de Usuario

| ID | Grupo | Color | Descripción |
|----|-------|-------|-------------|
| 1 | Invitados | #000000 | Usuarios no registrados |
| 2 | Registrados | #0066CC | Usuarios normales (default) |
| 3 | Super Moderadores | #CC0000 | Moderación avanzada |
| 4 | Administradores | #FF0000 | Control total del foro |
| 5 | Esperando Activación | #999999 | Pendientes de verificación |
| 6 | Moderadores | #009900 | Moderación básica |
| 7 | Baneados | #666666 | Usuarios sancionados |

## 🔒 Permisos

- **Administradores (ID: 4)**: Pueden cambiar grupos de usuarios
- **Usuarios autenticados**: Pueden crear threads, comentarios, dar reputación, gestionar su avatar
- **Propios recursos**: Solo pueden editar/eliminar sus propios avatares y reputaciones otorgadas

## 🚀 Próximas Características

- [ ] Búsqueda de threads y usuarios
- [ ] Sistema de notificaciones
- [ ] Mensajes privados
- [ ] Editor WYSIWYG mejorado
- [ ] Sistema de reportes
- [ ] Moderación inline
- [ ] Tema oscuro
- [ ] API REST completa documentada
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Sistema de badges/logros

## 📝 Licencia

MIT

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor abre un issue primero para discutir los cambios propuestos.

## 📡 Endpoints completos de la API

### 🔐 Autenticación
- `POST /api/auth/register` - Registro de nuevo usuario
  - Body: `{ email: string, username: string, password: string }`
  - Asigna automáticamente al grupo "Registrados"
- `POST /api/auth/login` - Iniciar sesión
  - Body: `{ usernameOrEmail: string, password: string }`
  - Retorna JWT en cookie HttpOnly
- `POST /api/auth/logout` - Cerrar sesión 🔒
- `GET /api/auth/me` - Obtener usuario actual 🔒
- `GET /api/auth/check` - Verificar autenticación

### 📁 Categorías
- `GET /api/categories` - Listar categorías con contador de posts

### 📊 Estadísticas
- `GET /api/stats` - Estadísticas generales del foro
  - Retorna: total threads, posts, último post, miembros totales, miembro más nuevo

### 📝 Posts/Threads
- `GET /api/categories/:id/posts` - Posts de una categoría (paginado)
  - Query: `?page=1&limit=50`
- `POST /api/categories/:id/posts` - Crear nuevo thread 🔒
  - Body: `{ title: string, content: string }`
  - AuthorId se obtiene del token JWT
- `GET /api/posts/:slug` - Obtener thread completo
  - Incluye autor con stats y reputación

### 💬 Comentarios
- `GET /api/posts/:id/comments` - Comentarios de un post
  - Incluye stats de autor y reputación
- `POST /api/posts/:id/comments` - Crear comentario 🔒
  - Body: `{ content: string }`
  - AuthorId se obtiene del token JWT

### 👥 Miembros y Perfiles
- `GET /api/members` - Lista de miembros paginada
  - Query: `?page=1&limit=20`
  - Incluye reputación y grupo
- `GET /api/user/:username` - Perfil completo de usuario
  - Stats, reputación, threads recientes

### 👑 Grupos de Usuario
- `GET /api/groups` - Listar todos los grupos
- `GET /api/groups/:id/users` - Usuarios de un grupo específico
- `PUT /api/users/:userId/group` - Cambiar grupo de usuario 🔒
  - Body: `{ newGroupId: number }`
  - Solo administradores (userGroupId: 4)

### 🖼️ Avatares
- `POST /api/users/:userId/avatar` - Subir avatar 🔒
  - Form-data: `avatar` (imagen, max 5MB)
  - Auto-resize a 200x200px
  - Solo usuario propio
- `DELETE /api/users/:userId/avatar` - Eliminar avatar 🔒
  - Solo usuario propio

### ⭐ Reputación
- `GET /api/reputation/:username` - Reporte de reputación
  - Stats totales y por periodo
  - Lista completa de reputaciones recibidas
- `POST /api/reputation` - Dar reputación 🔒
  - Body: `{ toUserId: number, type: 'positive'|'neutral'|'negative', comment?: string }`
  - Validación: no auto-reputación
- `DELETE /api/reputation/:id` - Eliminar reputación 🔒
  - Solo quien la otorgó puede eliminarla

🔒 = Requiere autenticación JWTpor slug con estadísticas del autor

### Comments
- `GET /api/posts/:id/comments` - Obtener comentarios de un post con estadísticas
- `POST /api/posts/:id/comments` - Crear comentario en un post
  - Body: `{ content: string, authorId: number }`
