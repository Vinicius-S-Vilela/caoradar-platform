import os
import cloudinary
from dotenv import load_dotenv

load_dotenv()

# --- CAMINHOS DE PASTAS E ARQUIVOS ---
FOLDER_TEMP = "temp_crops"

# CSV para cães DETECTADOS (por câmeras/vídeos)
CSV_AVISTAMENTOS_DETECTADOS = "avistamentos_detectados.csv"

# CSV para cães PERDIDOS (relatos de tutores)
CSV_RELATOS_PERDIDOS = "relatos_perdidos.csv"

# (Legado - descontinuado)
CSV_PATH = CSV_AVISTAMENTOS_DETECTADOS
        
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