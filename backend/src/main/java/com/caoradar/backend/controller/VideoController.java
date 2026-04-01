package com.caoradar.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/video")
public class VideoController {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${IA_SERVICE_URL:http://host.docker.internal:8000}")
    private String iaServiceUrl;

    public static class ProcessarVideoDTO {
        public String cameraId;
        public String videoUrl;
        public String dataHora;
    }

    /**
     * Recebe requisição do frontend e repassa para o IA Service.
     * Frontend → Backend → IA Service (processamento de vídeo)
     */
    @PostMapping("/processar")
    public ResponseEntity<?> processarVideo(@RequestBody ProcessarVideoDTO dto) {
        System.out.println("🎬 Recebendo vídeo da câmera " + dto.cameraId + " para processamento IA");

        try {
            // Monta payload para o IA Service
            Map<String, String> payload = Map.of(
                "camera_origem_id", dto.cameraId,
                "video_url", dto.videoUrl,
                "data_hora", dto.dataHora
            );

            String iaUrl = iaServiceUrl + "/api/video/process";
            System.out.println("📡 Enviando para IA Service: " + iaUrl);

            ResponseEntity<Map> response = restTemplate.postForEntity(iaUrl, payload, Map.class);

            System.out.println("✅ IA Service respondeu: " + response.getStatusCode());
            return ResponseEntity.ok(response.getBody());

        } catch (Exception e) {
            System.err.println("❌ Erro ao processar vídeo: " + e.getMessage());
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "error", "Erro ao processar vídeo",
                    "detail", e.getMessage()
                ));
        }
    }
}
