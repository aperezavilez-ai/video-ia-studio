# Guía de Instalación - Video IA Studio

## Requisitos Previos

- **Node.js**: 20.x o superior
- **Python**: 3.11 o superior
- **Docker**: 24.x o superior (opcional)
- **GPU**: NVIDIA con CUDA 12.1+ (para generación de video local)

## Instalación Rápida (Local)

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd "VIDEO IA STUDIO"
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env con tus API keys
```

### 3. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

El backend estará disponible en: http://localhost:8000

### 4. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en: http://localhost:3000

## Instalación con Docker

### 1. Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 2. Levantar Servicios
```bash
docker-compose up -d
```

### 3. Verificar Estado
```bash
docker-compose ps
```

### 4. Ver Logs
```bash
docker-compose logs -f
```

## Estructura de Servicios

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Configuración de Director IA (Gafcore Gateway)

### Gafcore Gateway
1. Iniciar tu servidor o gateway local de Gafcore (por defecto en `http://localhost:8080/v1`).
2. Configurar en tu archivo `.env`:
   ```env
   GAFCORE_GATEWAY_URL=http://localhost:8080/v1
   GAFCORE_API_KEY=tu-llave-gafcore
   GAFCORE_DEFAULT_MODEL=gafcore-director
   ```

## Solución de Problemas

### Backend no inicia
```bash
# Verificar dependencias
pip list
# Reinstalar si es necesario
pip install -r requirements.txt --force-reinstall
```

### Frontend no compila
```bash
# Limpiar caché
rm -rf .next node_modules
npm install
npm run dev
```

### Base de datos no conecta
```bash
# Verificar PostgreSQL
docker-compose ps postgres
# Reiniciar si es necesario
docker-compose restart postgres
```

## Próximos Pasos

1. Crear cuenta de administrador
2. Configurar modelos de IA
3. Probar generación de escenas
4. Consultar documentación en `/docs`

## Notas Importantes

- La generación de video local requiere GPU NVIDIA
- Los modelos de IA se descargarán automáticamente al primer uso
- El directorio `storage/` almacenará todos los assets generados
