package com.caoradar.backend.controller;

import com.caoradar.backend.model.*;
import com.caoradar.backend.repository.AvistamentoIARepository;
import com.caoradar.backend.repository.MatchRepository;
import com.caoradar.backend.repository.RelatoPerdaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/matches")
public class MatchController {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private RelatoPerdaRepository relatoRepository;

    @Autowired
    private AvistamentoIARepository avistamentoRepository;

    // GET /matches/relato/{relatoId}
    @GetMapping("/relato/{relatoId}")
    public ResponseEntity<List<Match>> listarMatchesDoRelato(@PathVariable UUID relatoId) {
        RelatoPerda relato = new RelatoPerda();
        relato.setId(relatoId);
        List<Match> matches = matchRepository.findByRelatoOrderByScoreSimilaridadeDesc(relato);
        return ResponseEntity.ok(matches);
    }

    // POST /matches — chamado pelo IA Service para persistir um match
    @PostMapping
    public ResponseEntity<?> criarMatch(@RequestBody Map<String, Object> body) {
        try {
            UUID relatoId      = UUID.fromString(String.valueOf(body.get("relatoId")));
            UUID avistamentoId = UUID.fromString(String.valueOf(body.get("avistamentoId")));
            double score       = ((Number) body.get("score")).doubleValue();
            String justificativa = body.getOrDefault("justificativa", "").toString();

            Optional<RelatoPerda> relatoOpt = relatoRepository.findById(relatoId);
            Optional<AvistamentoIA> avistOpt = avistamentoRepository.findById(avistamentoId);

            if (relatoOpt.isEmpty() || avistOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Relato ou avistamento não encontrado"));
            }

            Match match = new Match();
            match.setRelato(relatoOpt.get());
            match.setAvistamento(avistOpt.get());
            match.setScoreSimilaridade(score);
            match.setExplicacaoLLM(justificativa);
            match.setStatus(StatusMatch.PENDENTE_ANALISE);

            Match salvo = matchRepository.save(match);
            System.out.println("✅ Match salvo via IA Service (ID: " + salvo.getId() + ", score: " + score + ")");
            return ResponseEntity.ok(Map.of("id", salvo.getId().toString()));

        } catch (Exception e) {
            System.err.println("❌ Erro ao salvar match: " + e.getMessage());
            return ResponseEntity.internalServerError()
                .body(Map.of("error", e.getMessage()));
        }
    }
}