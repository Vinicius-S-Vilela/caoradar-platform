package com.caoradar.backend.service;

import com.caoradar.backend.model.*;
import com.caoradar.backend.repository.AvistamentoIARepository;
import com.caoradar.backend.repository.CameraRepository;
import com.caoradar.backend.repository.MatchRepository;
import com.caoradar.backend.repository.RelatoPerdaRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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

    /**
     * Este é o método que será chamado quando o Python enviar um POST.
     * Ele orquestra todo o fluxo de "Matching".
     */
    @Transactional
    public AvistamentoIA processarNovoAvistamento(AvistamentoIA avistamento, String codigoCamera) {
        
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

        // 3. BUSCA INTELIGENTE: Primeiro por Raça, depois com Fallback Geoespacial
        List<RelatoPerda> candidatos = new java.util.ArrayList<>();
        String racaDetectada = avistamento.getFeatures() != null ? avistamento.getFeatures().getRacaEstimada() : null;

        if (racaDetectada != null && !racaDetectada.trim().isEmpty()) {
            System.out.println("Buscando candidatos pela raça: " + racaDetectada);
            candidatos = relatoRepo.buscarPorStatusERaca(StatusRelato.EM_BUSCA, racaDetectada);
        }

        // FALLBACK: Se não achou nenhum cão da raça, ou a IA não informou a raça
        if (candidatos.isEmpty()) {
            System.out.println("Nenhum candidato da raça encontrado. Ativando fallback de Geolocalização (5km)...");
            Double lat = salvo.getCameraOrigem() != null ? salvo.getCameraOrigem().getLatitude() : 0.0;
            Double lon = salvo.getCameraOrigem() != null ? salvo.getCameraOrigem().getLongitude() : 0.0;

            candidatos = relatoRepo.buscarPorRaio(lat, lon, 5.0); // 5km de raio
        }

        // 4. CRIAR MATCHES PRELIMINARES
        for (RelatoPerda candidato : candidatos) {
            
            // Aqui poderíamos ter um filtro extra: "Só cria match se a cor for igual"
            // Por enquanto, criamos match para todos no raio geográfico
            
            Match match = new Match();
            match.setRelato(candidato);
            match.setAvistamento(salvo);
            match.setStatus(StatusMatch.PENDENTE_ANALISE);
            match.setScoreSimilaridade(0.0); // O LLM vai preencher isso depois
            match.setExplicacaoLLM("Match Geográfico: Avistado a menos de 5km do local de desaparecimento.");
            
            matchRepo.save(match);
        }
        
        System.out.println("Processamento concluído. Matches gerados: " + candidatos.size());
        return salvo;
    }
}