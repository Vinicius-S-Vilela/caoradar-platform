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


    //Método que será chamado quando o Python enviar um POST
    @Transactional
    public void processarNovoAvistamento(AvistamentoIA avistamento, String codigoCamera) {
        
        // 1. Vincular a Câmera Física
        Optional<Camera> cameraOpt = cameraRepo.findByCodigoExterno(codigoCamera);
        if (cameraOpt.isPresent()) {
            avistamento.setCameraOrigem(cameraOpt.get());
        } else {
            System.out.println("Câmera não encontrada: " + codigoCamera);
        }

        avistamento.setDataHora(LocalDateTime.now());
        
        // 2. Salvar o Avistamento no Banco
        AvistamentoIA salvo = avistamentoRepo.save(avistamento);

        // 3. BUSCA GEOGRÁFICA: Encontrar cães perdidos num raio de 5KM
        Double lat = salvo.getCameraOrigem() != null ? salvo.getCameraOrigem().getLatitude() : 0.0;
        Double lon = salvo.getCameraOrigem() != null ? salvo.getCameraOrigem().getLongitude() : 0.0;

        List<RelatoPerda> candidatos = relatoRepo.buscarPorRaio(lat, lon, 5.0); // 5km de raio

        // 4. CRIAR MATCHES PRELIMINARES
        for (RelatoPerda candidato : candidatos) {
            
            // Por enquanto cria o match para todos no raio geográfico (TEMPORÁRIO)
            
            Match match = new Match();
            match.setRelato(candidato);
            match.setAvistamento(salvo);
            match.setStatus(StatusMatch.PENDENTE_ANALISE);
            match.setScoreSimilaridade(0.0); // O LLM preenche
            match.setExplicacaoLLM("Match Geográfico: Avistado a menos de 5km do local de desaparecimento.");
            
            matchRepo.save(match);
        }
        
        System.out.println("Processamento concluído. Matches gerados: " + candidatos.size());
    }
}