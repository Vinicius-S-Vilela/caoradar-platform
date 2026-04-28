package com.caoradar.backend.service;

import com.caoradar.backend.model.RelatoPerda;
import com.caoradar.backend.model.StatusRelato;
import com.caoradar.backend.model.User;
import com.caoradar.backend.repository.MatchRepository;
import com.caoradar.backend.repository.RelatoPerdaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class RelatoService {

    @Autowired
    private RelatoPerdaRepository relatoRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${IA_API_URL:http://localhost:8000}")
    private String iaApiUrl;

    public RelatoPerda criarRelato(RelatoPerda relato) {
        relato.setStatus(StatusRelato.EM_BUSCA);
        if (relato.getDataDesaparecimento() == null) {
            relato.setDataDesaparecimento(LocalDateTime.now());
        }

        RelatoPerda salvo = relatoRepository.save(relato);

        // Dispara matching no IA service. Try/catch para nunca derrubar a criação.
        try {
            String fotoUrl = (salvo.getFotosUrl() != null && !salvo.getFotosUrl().isEmpty())
                    ? salvo.getFotosUrl().get(0)
                    : null;

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("relato_id", salvo.getId() != null ? salvo.getId().toString() : null);
            payload.put("nome_cao",  salvo.getNomeCao());
            payload.put("foto_url",  fotoUrl);
            payload.put("raca",      salvo.getRaca());
            payload.put("porte",     salvo.getPorteInformado());
            payload.put("cor",       salvo.getCorPredominante());
            payload.put("descricao", salvo.getDescricao());
            payload.put("latitude",  salvo.getLatitude());
            payload.put("longitude", salvo.getLongitude());

            String url = iaApiUrl.replaceAll("/+$", "") + "/api/match/relato";
            System.out.println("Disparando matching IA para relato " + salvo.getId() + " em " + url);
            restTemplate.postForEntity(url, payload, String.class);

        } catch (Exception e) {
            System.err.println("Erro ao contactar o microsserviço IA: " + e.getMessage());
        }

        return salvo;
    }

    public RelatoPerda atualizarStatus(UUID id, StatusRelato novoStatus) {
        RelatoPerda relato = relatoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Relato não encontrado: " + id));
        relato.setStatus(novoStatus);
        return relatoRepository.save(relato);
    }

    @Transactional
    public boolean excluirRelato(UUID id) {
        RelatoPerda relato = relatoRepository.findById(id).orElse(null);
        if (relato == null) return false;
        matchRepository.deleteByRelato(relato);
        relatoRepository.delete(relato);
        return true;
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