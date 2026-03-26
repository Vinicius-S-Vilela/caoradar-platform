const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/cameras';
    
    // Cria diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const cameraId = req.body.cameraId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `camera-${cameraId}-${timestamp}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use MP4, WebM, MOV ou OGG.'));
    }
  }
});

// Middleware CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Endpoint de upload
app.post('/api/cameras/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    if (!req.body.cameraId) {
      return res.status(400).json({
        success: false,
        message: 'ID da câmera é obrigatório'
      });
    }

    console.log('✅ Vídeo recebido:', {
      cameraId: req.body.cameraId,
      filename: req.file.filename,
      size: req.file.size,
      path: req.file.path
    });

    // Aqui você pode:
    // - Salvar informações no banco de dados
    // - Processar o vídeo com IA/YOLO
    // - Fazer análise de detecção de cães
    // - etc.

    res.json({
      success: true,
      message: 'Vídeo recebido e processado com sucesso!',
      cameraId: req.body.cameraId,
      fileName: req.file.filename,
      fileSize: req.file.size,
      uploadedAt: new Date()
    });
    
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar upload: ' + error.message
    });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📹 Endpoint de upload: http://localhost:${PORT}/api/cameras/upload`);
});