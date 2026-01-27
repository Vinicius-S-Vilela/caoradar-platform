package com.caoradar.backend.service;

import com.caoradar.backend.model.RelatoPerda;
import com.caoradar.backend.model.StatusRelato;
import com.caoradar.backend.model.User;
import com.caoradar.backend.repository.RelatoPerdaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RelatoService {

    @Autowired
    private RelatoPerdaRepository relatoRepository;

    public RelatoPerda criarRelato(RelatoPerda relato) {
        relato.setStatus(StatusRelato.EM_BUSCA);
        if (relato.getDataDesaparecimento() == null) {
            relato.setDataDesaparecimento(LocalDateTime.now());
        }
        return relatoRepository.save(relato);
    }

    public List<RelatoPerda> listarPorTutor(User tutor) {
        return relatoRepository.findByTutor(tutor);
    }

    // Busca cães num raio de X Km
    public List<RelatoPerda> buscarCandidatosProximos(Double lat, Double lon, Double raioKm) {
        return relatoRepository.buscarPorRaio(lat, lon, raioKm);
    }
}