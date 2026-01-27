package com.caoradar.backend.controller;

import com.caoradar.backend.model.AvistamentoIA;
import com.caoradar.backend.model.MetadadosVisuais;
import com.caoradar.backend.service.ProcessamentoIAService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/integracao")
public class WebhookIAController {

    @Autowired
    private ProcessamentoIAService processamentoService;

    // DTO: Classe que recebe o JSON do Python
    public static class InputPythonDTO {
        public String codigoCamera;
        public String snapshotUrl;
        public MetadadosVisuais features;
    }

    @PostMapping("/avistamentos")
    public ResponseEntity<String> receberAvistamento(@RequestBody InputPythonDTO input) {
        System.out.println("Recebendo avistamento da câmera: " + input.codigoCamera);

        // Converter DTO para Entidade
        AvistamentoIA avistamento = new AvistamentoIA();
        avistamento.setSnapshotUrl(input.snapshotUrl);
        avistamento.setFeatures(input.features);

        // Chamar o serviço
        processamentoService.processarNovoAvistamento(avistamento, input.codigoCamera);

        return ResponseEntity.ok("Avistamento processado com sucesso!");
    }
}