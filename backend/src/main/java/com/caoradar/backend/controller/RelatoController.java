package com.caoradar.backend.controller;

import com.caoradar.backend.model.RelatoPerda;
import com.caoradar.backend.model.StatusRelato;
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
    
    // DELETE /relatos/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarRelato(@PathVariable UUID id) {
        if (!relatoService.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        relatoService.deletarPorId(id);
        return ResponseEntity.ok("Relato removido com sucesso");
    }

    // PUT /relatos/{id}/status
    // Altera o status de um relato (ex: ENCONTRADO)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> atualizarStatus(@PathVariable UUID id, @RequestBody java.util.Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().body("Campo 'status' é obrigatório");
        }
        try {
            StatusRelato novoStatus = StatusRelato.valueOf(statusStr);
            RelatoPerda atualizado = relatoService.atualizarStatus(id, novoStatus);
            return ResponseEntity.ok(atualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Status inválido: " + statusStr);
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // GET /relatos?status=EM_BUSCA&cor=PRETO&raca=Poodle
    @GetMapping
    public ResponseEntity<List<RelatoPerda>> listarComFiltros(
            @RequestParam(required = false) StatusRelato status,
            @RequestParam(required = false) String cor,
            @RequestParam(required = false) String porte,
            @RequestParam(required = false) String raca) {
        
        List<RelatoPerda> resultados = relatoService.buscarComFiltros(status, cor, porte, raca);
        return ResponseEntity.ok(resultados);
    }
}