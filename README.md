# Sistema de Gestión Integral – Club de Rugby

Plataforma web para la gestión administrativa, deportiva y logística de un club de rugby. Reemplaza las planillas de Excel por una base de datos única: cobro de cuotas online con Mercado Pago, control de morosidad, métricas de partido post-video, testeos físicos, convocatorias e inventario de materiales.

Proyecto del **Seminario Integrador – Grupo 23**.

## Equipo

| Integrante | Rol |
| --- | --- |
| Francisco Buscaglia | Líder de proyecto · Backend (Core y módulo Deportivo) · QA y despliegue |
| Nicolás Coria | Frontend y kit de componentes · Módulo Logístico |
| Luca De Paola | Integración con Mercado Pago · Motor de citaciones |
| Dolores Goñi | Base de datos · Cuenta corriente y morosidad · Migración de datos |

## Módulos

1. **Padrón y usuarios**: inicio de sesión, roles (Tesorero, Analista de video, Entrenador, Jugador) y ABM de socios.
2. **Administración y finanzas**: cuotas mensuales, pago online con Mercado Pago, estado de cuenta y excepciones (beca, retraso contemplado, colaboración).
3. **Deportivo**: carga de métricas por partido (tackles, duelos, obtenciones), testeos físicos y reportes con gráficos.
4. **Citaciones**: armado de la convocatoria con bloqueo automático de jugadores morosos sin excepción.
5. **Logística**: catálogo de materiales, préstamos, devoluciones y alertas de vencimiento.

## Tecnologías

- **Backend:** Node.js + Express
- **Frontend:** React + Vite, Tailwind CSS, Recharts
- **Base de datos:** PostgreSQL (con Docker en desarrollo)
- **Pagos:** API de Mercado Pago (Checkout Pro + webhooks)

## Estructura del repositorio

```
club-rugby/
├── backend/                # API REST en Express
├── frontend/               # Aplicación React
├── database/               # Migraciones y datos de prueba (seeds)
├── scripts/
│   └── migracion-excel/    # Importación de las planillas del club
├── docs/                   # Manuales y documentación técnica
├── docker-compose.yml      # PostgreSQL para desarrollo
└── README.md
```

## Cómo levantar el proyecto

### Requisitos

- [Node.js](https://nodejs.org) 20 LTS o superior
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/<usuario>/club-rugby.git
cd club-rugby

# 2. Variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Completar los valores (base de datos, JWT, credenciales de prueba de Mercado Pago)

# 3. Levantar la base de datos
docker compose up -d

# 4. Backend
cd backend
npm install
npm run migrate      # crea las tablas
npm run seed         # carga datos de prueba
npm run dev          # http://localhost:3000

# 5. Frontend (en otra terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173
```

> Los comandos `migrate` y `seed` pueden cambiar según la herramienta de migraciones que se elija; se actualizan acá cuando quede definida.

## Forma de trabajo

- **Ramas**
  - `main`: solo versiones entregables.
  - `develop`: integración del trabajo de todos.
  - `feature/<tarea>`: una rama por tarea, por ejemplo `feature/3.4-morosidad`.
- **Pull Requests:** todo cambio entra a `develop` por PR, con al menos una revisión de otro integrante. Los PR que modifican pantallas incluyen capturas en PC y celular.
- **Commits** en español, con prefijo:
  - `feat:` nueva funcionalidad
  - `fix:` corrección
  - `test:` pruebas
  - `docs:` documentación
- **Secretos:** las claves (Mercado Pago, JWT, base de datos) van solo en `.env`, que no se sube al repositorio. Se mantiene actualizado el `.env.example`.
- **Interfaz:** se usan únicamente los componentes de `frontend/src/components` y los colores definidos en `tailwind.config.js`, siguiendo los wireframes del informe.

## Cronograma

| Sprint | Fechas | Objetivo |
| --- | --- | --- |
| 1 | 16/11 – 20/11 | Repositorio, base de datos, autenticación y ABM de socios |
| 2 | 23/11 – 27/11 | Morosidad, Mercado Pago, módulos Deportivo y Logístico, migración |
| 3 | 30/11 – 04/12 | Citaciones, pruebas, despliegue y presentación final |
