import os
import cloudinary
from dotenv import load_dotenv

load_dotenv()

# --- URL DO BACKEND (Spring Boot) ---
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8080")

# --- CAMINHOS DE PASTAS ---
FOLDER_TEMP = "temp_crops"

# --- CONFIGURAÇÕES DE VÍDEO (YOLO) ---
YOLO_POR_SEGUNDO = 5
TEMPO_IA_SEGUNDOS = 0.5
TEMPO_SUMICO_SEGUNDOS = 2

def setup_apis():
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True
    )
    if os.getenv("GOOGLE_API_KEY"):
        print("✅ [CONFIG] APIs inicializadas com sucesso.")
    print(f"✅ [CONFIG] Backend API: {BACKEND_API_URL}")
