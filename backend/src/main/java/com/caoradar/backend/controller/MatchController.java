package com.caoradar.backend.controller;

import com.caoradar.backend.model.Match;
import com.caoradar.backend.model.RelatoPerda;
import com.caoradar.backend.repository.MatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/matches")
public class MatchController {

    @Autowired
    private MatchRepository matchRepository;

    // GET /matches/relato/{relatoId}
    // Mostra os matches encontrados para um cão perdido
    @GetMapping("/relato/{relatoId}")
    public ResponseEntity<List<Match>> listarMatchesDoRelato(@PathVariable UUID relatoId) {
        RelatoPerda relato = new RelatoPerda();
        relato.setId(relatoId);
        
        List<Match> matches = matchRepository.findByRelatoOrderByScoreSimilaridadeDesc(relato);
        return ResponseEntity.ok(matches);
    }
}