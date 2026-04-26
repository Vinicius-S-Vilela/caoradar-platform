package com.caoradar.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/video")
public class VideoController {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${IA_API_URL:http://host.docker.internal:8000}")
    private String iaApiUrl;

    public static class ProcessarVideoDTO {
        public String cameraId;
        public String videoUrl;
        public String dataHora;
    }

    /**
     * Retorna 202 imediatamente e dispara o processamento da IA em background.
     * Evita timeout no frontend (IA pode levar 60-120s).
     */
    @PostMapping("/processar")
    public ResponseEntity<?> processarVideo(@RequestBody ProcessarVideoDTO dto) {
        System.out.println("🎬 Recebendo vídeo da câmera " + dto.cameraId + " — processamento em background");

        // Dispara em background e retorna 202 imediatamente
        CompletableFuture.runAsync(() -> {
            try {
                Map<String, String> payload = Map.of(
                    "camera_origem_id", dto.cameraId,
                    "video_url",        dto.videoUrl,
                    "data_hora",        dto.dataHora
                );
                String iaUrl = iaApiUrl.replaceAll("/+$", "") + "/api/video/process";
                System.out.println("📡 [BG] Enviando para IA Service: " + iaUrl);
                restTemplate.postForEntity(iaUrl, payload, Map.class);
                System.out.println("✅ [BG] IA Service concluiu para câmera " + dto.cameraId);
            } catch (Exception e) {
                System.err.println("❌ [BG] Erro ao processar vídeo: " + e.getMessage());
            }
        });

        return ResponseEntity.accepted()
            .body(Map.of("status", "processing", "message", "Vídeo recebido. Processamento iniciado em background."));
    }
}
