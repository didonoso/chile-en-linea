# Chile en Línea - Foro Comunitario

Aplicación de foro web moderna construida con NestJS, Prisma y PostgreSQL, con un diseño inspirado en MyBB.

## 🚀 Características

- ✨ Interfaz inspirada en MyBB con diseño moderno
- 📝 Creación y visualización de threads
- 👤 Sistema de usuarios con estadísticas
- 💬 Categorías organizadas
- 🎨 Editor BBCode con emojis
- 📊 Estadísticas en tiempo real
- 🔍 SEO-friendly con slugs únicos
- ⚡ Optimizado para rendimiento

## 🛠️ Tecnologías

### Backend
- **NestJS** - Framework Node.js progresivo
- **Prisma** - ORM moderno para TypeScript
- **PostgreSQL** - Base de datos relacional
- **TypeScript** - Tipado estático

### Frontend
- **HTML5/CSS3** - Estructura y estilos
- **JavaScript Vanilla** - Interactividad
- **Fetch API** - Comunicación con backend

## 📋 Requisitos Previos

- Node.js 16.x o superior
- PostgreSQL 12.x o superior
- npm o yarn

## 🔧 Instalación

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar variables de entorno**
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/chile_en_linea"
```

3. **Ejecutar migraciones de base de datos**
```bash
npx prisma migrate dev
npx prisma generate
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

3. Ejecutar migraciones:
```bash
npx prisma migrate dev --name init
```

4. Iniciar servidor:
```bash
npm run start:dev
```

## 📡 Endpoints

### Categories
- `GET /api/categories` - Listar todas las categorías con contador de posts

### Stats
- `GET /api/stats` - Obtener estadísticas del foro (threads, posts, último post)

### Posts
- `GET /api/categories/:id/posts` - Obtener posts de una categoría específica
- `POST /api/categories/:id/posts` - Crear nuevo post/thread
  - Body: `{ title: string, content: string, authorId: number }`
- `GET /api/posts/:slug` - Obtener post completo por slug con estadísticas del autor

### Comments
- `GET /api/posts/:id/comments` - Obtener comentarios de un post con estadísticas
- `POST /api/posts/:id/comments` - Crear comentario en un post
  - Body: `{ content: string, authorId: number }`

## 🎯 Próximos pasos

- [ ] Implementar autenticación (JWT)
- [ ] Agregar DTOs y validación
- [ ] Sistema de likes
- [ ] Paginación
- [ ] Búsqueda
- [ ] Upload de imágenes
Foro CL
