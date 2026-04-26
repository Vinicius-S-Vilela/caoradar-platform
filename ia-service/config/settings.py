import os
import cloudinary
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# URLs DOS SERVIÇOS EXTERNOS
# ==========================================
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8080").strip().rstrip("/")
FRONTEND_URL    = os.getenv("FRONTEND_URL",    "http://localhost:4200").strip().rstrip("/")

# Origens permitidas no CORS (separadas por vírgula no .env)
# Ex: CORS_ORIGINS=https://caoradar.vercel.app,http://localhost:4200
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", f"{FRONTEND_URL},http://localhost:4200").split(",")
    if origin.strip()
]

# ==========================================
# PASTA TEMPORÁRIA (processamento de vídeo)
# ==========================================
FOLDER_TEMP = "temp_crops"

# ==========================================
# PARÂMETROS DO PIPELINE DE VÍDEO (YOLO)
# ==========================================
YOLO_POR_SEGUNDO     = int(os.getenv("YOLO_POR_SEGUNDO",    "5"))   # frames analisados por segundo
TEMPO_IA_SEGUNDOS    = float(os.getenv("TEMPO_IA_SEGUNDOS", "0.5")) # intervalo entre chamadas Gemini por cão
TEMPO_SUMICO_SEGUNDOS = float(os.getenv("TEMPO_SUMICO_SEGUNDOS", "2"))  # segundos até considerar cão saiu

def setup_apis():
    """Inicializa Cloudinary e valida variáveis obrigatórias."""
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True
    )
    if os.getenv("GOOGLE_API_KEY"):
        print("✅ [CONFIG] Google API inicializada.")
    else:
        print("⚠️  [CONFIG] GOOGLE_API_KEY não encontrada — agentes Gemini vão falhar.")

    print(f"✅ [CONFIG] Backend API: {BACKEND_API_URL}")
    print(f"✅ [CONFIG] CORS origins: {CORS_ORIGINS}")
