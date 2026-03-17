package com.caoradar.backend.controller;

import com.caoradar.backend.model.AvistamentoIA;
import com.caoradar.backend.service.AvistamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/avistamentos")
public class AvistamentoController {

    @Autowired
    private AvistamentoService avistamentoService;

    // GET /avistamentos?codigoCamera=CAM-01&cor=Caramelo&raca=Vira-lata
    @GetMapping
    public ResponseEntity<List<AvistamentoIA>> listar(
            @RequestParam(required = false) String codigoCamera,
            @RequestParam(required = false) String cor,
            @RequestParam(required = false) String raca) {
        
        List<AvistamentoIA> resultados = avistamentoService.buscarComFiltros(codigoCamera, cor, raca);
        return ResponseEntity.ok(resultados);
    }
}