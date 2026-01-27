package com.caoradar.backend.controller;

import com.caoradar.backend.model.RelatoPerda;
import com.caoradar.backend.model.User;
import com.caoradar.backend.service.RelatoService;
import com.caoradar.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/relatos")
public class RelatoController {

    @Autowired
    private RelatoService relatoService;
    
    @Autowired
    private UserService userService;

    // POST /relatos?tutorId=
    // Cria um relato
    @PostMapping
    public ResponseEntity<?> criarRelato(@RequestBody RelatoPerda relato, @RequestParam UUID tutorId) {
        // Busca o tutor no banco para vincular ao relato
        User tutor = userService.buscarPorId(tutorId).orElse(null);
        
        if (tutor == null) {
            return ResponseEntity.badRequest().body("Tutor não encontrado com ID: " + tutorId);
        }

        relato.setTutor(tutor);
        RelatoPerda salvo = relatoService.criarRelato(relato);
        return ResponseEntity.ok(salvo);
    }

    // GET /relatos/tutor/{tutorId}
    // Lista os cães perdidos daquele tutor
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<RelatoPerda>> listarPorTutor(@PathVariable UUID tutorId) {
        User tutor = new User();
        tutor.setId(tutorId);
        return ResponseEntity.ok(relatoService.listarPorTutor(tutor));
    }
}