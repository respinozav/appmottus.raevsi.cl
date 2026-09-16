# 🗺️ Roadmap de Continuación del Proyecto Mottus

Este documento contiene el grafo de dependencias, estado actual del sistema y la hoja de ruta para continuar el desarrollo mañana.

---

## 📊 Grafo de Estado del Sistema y Próximos Pasos

```mermaid
graph TD
    %% Estilos de Nodos
    classDef done fill:#22c55e,stroke:#15803d,stroke-width:2px,color:#fff;
    classDef inProgress fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef pending fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef future fill:#64748b,stroke:#475569,stroke-width:2px,color:#fff;

    %% Nodos Completados
    subgraph S1["✅ Fase 1: Arquitectura y Migración de Base de Datos"]
        A1["Aislamiento users<br/>(Admin & Coaches)"]:::done
        A2["Creación students<br/>(Exclusivo Alumnos)"]:::done
        A3["Migración RDS AWS<br/>(Esquema bdmottus)"]:::done
        A4["Modelos SQLAlchemy & Schemas Pydantic"]:::done
        A5["Auth Unificado<br/>(/auth/login para users y students)"]:::done
        A6["Flow Tests 100% OK<br/>(10/10 endpoints validados)"]:::done
    end

    %% Nodos En Progreso / Listo para probar
    subgraph S2["🚀 Fase 2: Entornos Locales Activos"]
        B1["Backend FastAPI<br/>(:8006/docs)"]:::done
        B2["Frontend Vite/Vue<br/>(:5173)"]:::done
    end

    %% Nodos Pendientes para Mañana
    subgraph S3["🎯 Fase 3: Tareas para Mañana"]
        C1["Verificación E2E en Navegador<br/>(Registro y Login de Alumno)"]:::inProgress
        C2["Vistas de Alumno en Frontend<br/>(Dashboard y Perfil)"]:::pending
        C3["Flujo de Métricas / Evaluaciones<br/>(Coach registra a Alumno)"]:::pending
        C4["Gestión de Membresías y Asistencia<br/>(Validación de estados activos)"]:::pending
    end

    %% Fase Futura
    subgraph S4["🔮 Fase 4: Próximos Hitos"]
        D1["Módulo de Pagos / Transbank"]:::future
        D2["Notificaciones & Alertas WhatsApp/Email"]:::future
        D3["Despliegue a Producción (CI/CD)"]:::future
    end

    %% Relaciones
    A1 & A2 --> A3
    A3 --> A4 --> A5 --> A6
    A6 --> B1 & B2
    B1 & B2 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> D1
    D1 --> D2
    D2 --> D3
```

---

## 📌 Resumen de Arquitectura Actual

| Capa | Componente | Detalle / Estado |
| :--- | :--- | :--- |
| **BD (PostgreSQL RDS)** | `bdmottus.users` | Exclusivo para administradores (`admin`) y entrenadores (`coach`). |
| **BD (PostgreSQL RDS)** | `bdmottus.students` | Exclusivo para alumnos. Maneja `medical_conditions`, `emergency_contact`, etc. |
| **Backend (FastAPI)** | `app/api/v1/auth.py` | Busca credenciales en `users` o `students` transparentemente. |
| **Backend (FastAPI)** | `app/api/v1/metrics.py` | FK `recorded_by` desacoplado para alumnos auto-registrados. |
| **Frontend (React/Vite)** | `src/services/api.js` | Conectado a `http://localhost:8006/api/v1` en dev y `/api/v1` en prod. |

---

## 📋 Plan de Acción Recomendado para Iniciar Mañana

1. **Revisión en el Navegador (`http://localhost:5173`)**:
   - Probar el formulario de Login y Registro de alumnos en la interfaz.
   - Confirmar que el token JWT devuelva el rol y active la sesión correcta.
2. **Dashboard de Alumno vs Coach**:
   - Ajustar las vistas del menú de navegación según el rol retornado (`student`, `coach`, `admin`).
3. **Flujo de Evaluaciones Físicas y Asistencias**:
   - Validar que un coach pueda seleccionar un alumno de la tabla `students` para registrar métricas corporales y asistencias.
