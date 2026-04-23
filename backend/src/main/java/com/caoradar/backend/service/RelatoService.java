package com.caoradar.backend.service;

import com.caoradar.backend.model.AvistamentoIA;
import com.caoradar.backend.model.RelatoPerda;
import com.caoradar.backend.model.StatusRelato;
import com.caoradar.backend.model.User;
import com.caoradar.backend.repository.RelatoPerdaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RelatoService {

    @Autowired
    private RelatoPerdaRepository relatoRepository;

    @Autowired
    private AvistamentoService avistamentoService;

    @Autowired
    private RestTemplate restTemplate;

    // URL provisória onde o Python estará
    private final String PYTHON_API_URL = "http://localhost:8000/api/comparar-relato";

    // DTO interno para enviar ao Python
    public static class PayloadParaPython {
        public RelatoPerda relato;
        public List<AvistamentoIA> candidatos;

        public PayloadParaPython(RelatoPerda relato, List<AvistamentoIA> candidatos) {
            this.relato = relato;
            this.candidatos = candidatos;
        }
    }

    public RelatoPerda criarRelato(RelatoPerda relato) {
        // 1. Regras de Negócio Iniciais
        relato.setStatus(StatusRelato.EM_BUSCA);
        if (relato.getDataDesaparecimento() == null) {
            relato.setDataDesaparecimento(LocalDateTime.now());
        }
        
        // 2. Salva no banco de dados
        RelatoPerda salvo = relatoRepository.save(relato);

        // 3. O GATILHO ATIVO (Try-Catch para evitar que o Java falhe se o Python estiver offline)
        try {
            // Busca os avistamentos antigos que batem com a Cor e a Raça do cão recém-perdido
            List<AvistamentoIA> candidatos = avistamentoService.buscarComFiltros(
                    null, salvo.getCorPredominante(), salvo.getRaca()
            );

            // Chamar o Python se houver pelo menos 1 candidato
            if (!candidatos.isEmpty()) {
                PayloadParaPython payload = new PayloadParaPython(salvo, candidatos);
                
                // Dispara o POST para o Python
                System.out.println("Disparando aviso para o Python com " + candidatos.size() + " candidato(s)!");
                restTemplate.postForEntity(PYTHON_API_URL, payload, String.class);
            }

        } catch (Exception e) {
            System.err.println("Erro ao contactar o microsserviço Python: " + e.getMessage());
        }

        return salvo;
    }

    public List<RelatoPerda> listarPorTutor(User tutor) {
        return relatoRepository.findByTutor(tutor);
    }

    public List<RelatoPerda> buscarCandidatosProximos(Double lat, Double lon, Double raioKm) {
        return relatoRepository.buscarPorRaio(lat, lon, raioKm);
    }

    public List<RelatoPerda> buscarComFiltros(StatusRelato status, String cor, String porte, String raca) {
        return relatoRepository.buscarComFiltros(status, cor, porte, raca);
    }
}