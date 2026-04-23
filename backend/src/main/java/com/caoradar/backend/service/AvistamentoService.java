package com.caoradar.backend.service;

import com.caoradar.backend.model.AvistamentoIA;
import com.caoradar.backend.repository.AvistamentoIARepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

// API de Streams
@Service
public class AvistamentoService {

    @Autowired
    private AvistamentoIARepository avistamentoRepo;

    public List<AvistamentoIA> buscarComFiltros(String codigoCamera, String cor, String raca) {
        // 1. Vai ao banco buscar todos
        List<AvistamentoIA> todos = avistamentoRepo.findAll();

        // 2. Filtra a lista na memória do servidor usando Java Streams
        return todos.stream()
            // Filtra por Câmera (se enviado)
            .filter(a -> codigoCamera == null || (a.getCameraOrigem() != null && a.getCameraOrigem().getCodigoExterno().equals(codigoCamera)))
            // Filtra por Cor dentro do JSON (se enviado)
            .filter(a -> cor == null || (a.getFeatures() != null && cor.equalsIgnoreCase(a.getFeatures().getCorPredominante())))
            // Filtra por Raça dentro do JSON (se enviado)
            .filter(a -> raca == null || (a.getFeatures() != null && raca.equalsIgnoreCase(a.getFeatures().getRacaEstimada())))
            .collect(Collectors.toList());
    }
}