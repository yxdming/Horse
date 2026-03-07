from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.utils.file_handler import file_handler


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    app = FastAPI(
        title="AIDP Management System API",
        description="AI Data Platform Management System Backend",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc"
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:3000",
            "http://7.250.75.172:5173",
            "http://7.250.75.172:3000"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Ensure data files exist on startup
    @app.on_event("startup")
    async def startup_event():
        file_handler.ensure_data_files()

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "ok", "message": "AIDP API is running"}

    # Root endpoint
    @app.get("/")
    async def root():
        return {
            "message": "AIDP Management System API",
            "version": "1.0.0",
            "docs": "/api/docs"
        }

    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(exc)}"}
        )

    # Import and register API routes
    from app.api import users, knowledge, stats, config, auth, memory

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(users.router, prefix="/api/users", tags=["users"])
    app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
    app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
    app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
    app.include_router(config.router, prefix="/api/config", tags=["config"])

    return app


# Create app instance
app = create_app()
