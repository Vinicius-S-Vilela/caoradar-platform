package com.caoradar.backend.service;

import com.caoradar.backend.model.*;
import com.caoradar.backend.repository.AvistamentoIARepository;
import com.caoradar.backend.repository.MatchRepository;
import com.caoradar.backend.repository.RelatoPerdaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class RelatoService {

    @Autowired
    private RelatoPerdaRepository relatoRepository;

    @Autowired
    private AvistamentoIARepository avistamentoRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private RestTemplate restTemplate;

    // URL do microsserviço Python (IA Service)
    // Dentro do Docker, usa host.docker.internal para alcançar a máquina host
    @org.springframework.beans.factory.annotation.Value("${IA_SERVICE_URL:http://host.docker.internal:8000}")
    private String iaServiceBaseUrl;

    private String getPythonApiUrl() {
        return iaServiceBaseUrl + "/api/relato/criar";
    }

    public RelatoPerda criarRelato(RelatoPerda relato) {
        // 1. Regras de Negócio Iniciais
        relato.setStatus(StatusRelato.EM_BUSCA);
        if (relato.getDataDesaparecimento() == null) {
            relato.setDataDesaparecimento(LocalDateTime.now());
        }

        // 2. Salva no banco de dados
        RelatoPerda salvo = relatoRepository.save(relato);

        // 3. Chama a IA para fazer matching com avistamentos existentes
        try {
            // Monta payload compatível com CriarRelatoRequest do FastAPI
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("nome_cao", salvo.getNomeCao());
            payload.put("descricao", salvo.getDescricao() != null ? salvo.getDescricao() : "");

            // Pega a primeira foto do relato
            List<String> fotos = salvo.getFotosUrl();
            payload.put("foto_url", (fotos != null && !fotos.isEmpty()) ? fotos.get(0) : "");

            payload.put("latitude", salvo.getLatitude() != null ? salvo.getLatitude() : 0.0);
            payload.put("longitude", salvo.getLongitude() != null ? salvo.getLongitude() : 0.0);
            payload.put("data_desaparecimento", salvo.getDataDesaparecimento().toString());
            payload.put("raca", salvo.getRaca());
            payload.put("porte", salvo.getPorteInformado());
            payload.put("cor", salvo.getCorPredominante());
            payload.put("tutor_id", salvo.getTutor().getId().toString());

            String url = getPythonApiUrl();
            System.out.println("📡 Enviando relato para IA Service (" + url + "): " + salvo.getNomeCao());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, payload, Map.class);

            // Processa matches retornados pela IA
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

                            // Busca o avistamento no banco pelo ID
                            Optional<AvistamentoIA> avistamentoOpt = avistamentoRepository.findById(UUID.fromString(idCandidato));
                            if (avistamentoOpt.isPresent()) {
                                Match match = new Match();
                                match.setRelato(salvo);
                                match.setAvistamento(avistamentoOpt.get());
                                match.setScoreSimilaridade(probabilidade);
                                match.setExplicacaoLLM(justificativa);
                                match.setStatus(StatusMatch.PENDENTE_ANALISE);
                                matchRepository.save(match);
                                salvosCount++;
                            }
                        } catch (Exception e) {
                            System.err.println("Erro ao salvar match individual: " + e.getMessage());
                        }
                    }
                    System.out.println("✅ " + salvosCount + " match(es) salvos no banco via IA.");
                }
            }

        } catch (Exception e) {
            System.err.println("⚠️ IA Service indisponível (relato salvo normalmente): " + e.getMessage());
        }

        return salvo;
    }

    public RelatoPerda atualizarStatus(java.util.UUID id, StatusRelato novoStatus) {
        RelatoPerda relato = relatoRepository.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Relato não encontrado: " + id));
        relato.setStatus(novoStatus);
        return relatoRepository.save(relato);
    }

    public boolean existsById(java.util.UUID id) {
        return relatoRepository.existsById(id);
    }

    public void deletarPorId(java.util.UUID id) {
        RelatoPerda relato = relatoRepository.findById(id).orElseThrow();
        // Remove matches vinculados antes (FK constraint)
        List<Match> matches = matchRepository.findByRelatoOrderByScoreSimilaridadeDesc(relato);
        matchRepository.deleteAll(matches);
        relatoRepository.delete(relato);
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
