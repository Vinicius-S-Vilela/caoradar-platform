package com.caoradar.backend.service;

import com.caoradar.backend.model.*;
import com.caoradar.backend.repository.AvistamentoIARepository;
import com.caoradar.backend.repository.CameraRepository;
import com.caoradar.backend.repository.MatchRepository;
import com.caoradar.backend.repository.RelatoPerdaRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ProcessamentoIAService {

    @Autowired
    private AvistamentoIARepository avistamentoRepo;
    @Autowired
    private RelatoPerdaRepository relatoRepo;
    @Autowired
    private MatchRepository matchRepo;
    @Autowired
    private CameraRepository cameraRepo;
    @Autowired
    private RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Value("${IA_SERVICE_URL:http://host.docker.internal:8000}")
    private String iaServiceBaseUrl;

    /**
     * Este é o método que será chamado quando o Python enviar um POST.
     * Ele orquestra todo o fluxo de "Matching".
     */
    @Transactional
    public void processarNovoAvistamento(AvistamentoIA avistamento, String codigoCamera) {
        
        // 1. Vincular a Câmera Física (Se existir)
        Optional<Camera> cameraOpt = cameraRepo.findByCodigoExterno(codigoCamera);
        if (cameraOpt.isPresent()) {
            avistamento.setCameraOrigem(cameraOpt.get());
            // Usamos a localização da câmera como base
            // (Assumindo que o avistamento tem lat/long zerado ou confiamos na câmera)
        } else {
            // Se não achar a câmera, logamos erro ou salvamos sem câmera
            System.out.println("Câmera não encontrada: " + codigoCamera);
        }

        avistamento.setDataHora(LocalDateTime.now());
        
        // 2. Salvar o Avistamento no Banco
        AvistamentoIA salvo = avistamentoRepo.save(avistamento);

        // 3. CHAMAR IA SERVICE PARA MATCHING REAL (Gemini multimodal)
        try {
            MetadadosVisuais features = salvo.getFeatures();
            String raca = features != null ? features.getRacaEstimada() : "Desconhecida";
            String cor = features != null ? features.getCorPredominante() : "";
            String porte = features != null ? features.getPorteEstimado() : "";
            Double confianca = features != null && features.getConfiancaDetecao() != null ? features.getConfiancaDetecao() : 0.0;
            List<String> extras = features != null ? features.getCaracteristicasExtras() : null;
            String detalhes = (extras != null && !extras.isEmpty()) ? String.join(", ", extras) : "";

            Double lat = salvo.getCameraOrigem() != null && salvo.getCameraOrigem().getLatitude() != null
                    ? salvo.getCameraOrigem().getLatitude() : 0.0;
            Double lon = salvo.getCameraOrigem() != null && salvo.getCameraOrigem().getLongitude() != null
                    ? salvo.getCameraOrigem().getLongitude() : 0.0;

            Map<String, Object> iaPayload = new LinkedHashMap<>();
            iaPayload.put("camera_id", codigoCamera);
            iaPayload.put("snapshot_url", salvo.getSnapshotUrl());
            iaPayload.put("raca_provavel", raca != null ? raca : "Desconhecida");
            iaPayload.put("cor_predominante", cor != null ? cor : "");
            iaPayload.put("porte", porte != null ? porte : "");
            iaPayload.put("detalhes", detalhes);
            iaPayload.put("latitude", lat);
            iaPayload.put("longitude", lon);
            iaPayload.put("confianca_detecao", confianca);

            String iaUrl = iaServiceBaseUrl + "/api/avistamento/criar";
            System.out.println("📡 Chamando IA Service para matching: " + iaUrl + " (raça: " + raca + ")");
            ResponseEntity<Map> response = restTemplate.postForEntity(iaUrl, iaPayload, Map.class);

            if (response.getBody() != null) {
                List<Map<String, Object>> matches = (List<Map<String, Object>>) response.getBody().get("matches");
                if (matches != null && !matches.isEmpty()) {
                    int salvosCount = 0;
                    for (Map<String, Object> matchData : matches) {
                        try {
                            String idCandidato = String.valueOf(matchData.get("id_candidato"));
                            Number probNum = (Number) matchData.get("probabilidade_match");
                            double probabilidade = probNum != null ? probNum.doubleValue() / 100.0 : 0.0;
                            String justificativa = String.valueOf(matchData.getOrDefault("justificativa_visual_e_texto", ""));

                            Optional<RelatoPerda> relatoOpt = relatoRepo.findById(UUID.fromString(idCandidato));
                            if (relatoOpt.isPresent()) {
                                Match match = new Match();
                                match.setRelato(relatoOpt.get());
                                match.setAvistamento(salvo);
                                match.setScoreSimilaridade(probabilidade);
                                match.setExplicacaoLLM(justificativa);
                                match.setStatus(StatusMatch.PENDENTE_ANALISE);
                                matchRepo.save(match);
                                salvosCount++;
                            }
                        } catch (Exception e) {
                            System.err.println("Erro ao salvar match individual: " + e.getMessage());
                        }
                    }
                    System.out.println("✅ " + salvosCount + " match(es) salvos via IA (avistamento → relatos perdidos).");
                } else {
                    System.out.println("ℹ️ IA não encontrou matches para este avistamento.");
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ IA Service indisponível para matching de avistamento: " + e.getMessage());
        }
    }
}