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
    public UUID processarNovoAvistamento(AvistamentoIA avistamento, String codigoCamera) {

        // 1. Vincular a Câmera Física (se existir)
        Optional<Camera> cameraOpt = cameraRepo.findByCodigoExterno(codigoCamera);
        if (cameraOpt.isPresent()) {
            avistamento.setCameraOrigem(cameraOpt.get());
        } else {
            System.out.println("Câmera não encontrada: " + codigoCamera);
        }

        avistamento.setDataHora(LocalDateTime.now());

        // 2. Salvar o avistamento no banco e retornar o ID gerado
        // O matching é disparado pelo próprio IA Service após salvar
        AvistamentoIA salvo = avistamentoRepo.save(avistamento);
        System.out.println("✅ Avistamento salvo (ID: " + salvo.getId() + ")");
        return salvo.getId();
    }
}