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

### Users
- `GET /users` - Listar usuarios
- `GET /users/:id` - Ver usuario
- `POST /users` - Crear usuario

### Categories
- `GET /categories` - Listar categorías
- `GET /categories/:id` - Ver categoría con posts
- `POST /categories` - Crear categoría

### Posts
- `GET /posts` - Listar posts
- `GET /posts?categoryId=1` - Posts por categoría
- `GET /posts/:id` - Ver post con comentarios
- `POST /posts` - Crear post

### Comments
- `GET /posts/:postId/comments` - Comentarios de un post
- `POST /posts/:postId/comments` - Crear comentario

Foro CL
