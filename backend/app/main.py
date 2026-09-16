from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, users, categories, exercises, routines, metrics, analytics

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite desarrollo y dominio appmottus.raevsi.cl
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Autenticación"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Usuarios & Registro"])
app.include_router(categories.router, prefix=f"{settings.API_V1_STR}/categories", tags=["Categorías"])
app.include_router(exercises.router, prefix=f"{settings.API_V1_STR}/exercises", tags=["Ejercicios"])
app.include_router(routines.router, prefix=f"{settings.API_V1_STR}/routines", tags=["Rutinas"])
app.include_router(metrics.router, prefix=f"{settings.API_V1_STR}/metrics", tags=["Métricas Corporales"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analítica & Cumplimiento"])

@app.get("/")
def root():
    return {
        "app": "Mottus Gym API",
        "domain": "appmottus.raevsi.cl",
        "status": "online",
        "docs": f"{settings.API_V1_STR}/docs"
    }
