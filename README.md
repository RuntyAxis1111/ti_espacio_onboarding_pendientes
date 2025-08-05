# HYBE LATAM FEED FINANCE

Una aplicación web para la gestión financiera de equipos TI de HYBE Latin America, construida con React, TypeScript, Tailwind CSS y Supabase.

## 🚀 Despliegue en Vercel

### Configuración Rápida

1. **Fork o clona este repositorio**

2. **Conecta con Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu cuenta de GitHub
   - Importa este repositorio

3. **Despliega automáticamente:**
   - Vercel detectará automáticamente que es un proyecto Vite
   - El despliegue se iniciará automáticamente
   - **No necesitas configurar variables de entorno** (las credenciales están embebidas en el código)

### Configuración Manual

Si prefieres configurar manualmente:

1. **Instala Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Inicia sesión:**
   ```bash
   vercel login
   ```

3. **Despliega:**
   ```bash
   vercel --prod
   ```

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de la construcción
npm run preview
```

## 📁 Estructura del Proyecto

```
src/
├── components/         # Componentes React
│   └── equipos/       # Componentes específicos de equipos TI
├── lib/               # Configuración de librerías
├── contexts/          # Contextos de React
└── pages/             # Páginas de la aplicación
```

## 🗄️ Base de Datos

La aplicación utiliza Supabase como backend. La tabla principal es:

- `equipos_ti` - Inventario de equipos de tecnología

## 🎨 Tecnologías

- **React 18** - Framework de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de CSS
- **Framer Motion** - Animaciones
- **Supabase** - Backend y base de datos
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **Vite** - Build tool y dev server

## 📱 Características

- ✅ Diseño responsive
- ✅ Gestión de inventario de equipos TI
- ✅ Gráficas y análisis financiero
- ✅ Integración con Supabase
- ✅ Animaciones fluidas
- ✅ Tablas editables en tiempo real
- ✅ Carga de archivos PDF

## 🔧 Configuración de Vercel

El archivo `vercel.json` incluye:

- Configuración de build automática
- Rewrites para SPA routing
- Headers de cache optimizados

## 🔒 Seguridad

Las credenciales de Supabase están embebidas directamente en el código para simplificar el despliegue. Esto es seguro para claves de servicio ya que están protegidas por Row Level Security (RLS) en Supabase.

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema financiero, contacta al equipo de finanzas.