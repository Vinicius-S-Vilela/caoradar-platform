package com.caoradar.backend.repository;

import com.caoradar.backend.model.Match;
import com.caoradar.backend.model.RelatoPerda;
import com.caoradar.backend.model.StatusMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MatchRepository extends JpaRepository<Match, UUID> {

    // Busca matches ordenado por score (melhor primeiro)
    List<Match> findByRelatoOrderByScoreSimilaridadeDesc(RelatoPerda relato);

    // Busca matches pendentes
    List<Match> findByRelatoAndStatus(RelatoPerda relato, StatusMatch status);
}