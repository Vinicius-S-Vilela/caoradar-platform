package com.caoradar.backend.controller;

import com.caoradar.backend.model.User;
import com.caoradar.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    // POST /users
    // Cria um novo tutor
    @PostMapping
    public ResponseEntity<User> criarUsuario(@RequestBody User user) {
        User salvo = userService.salvar(user);
        return ResponseEntity.ok(salvo);
    }

    // GET /users/{email}
    // Busca dados para login
    @GetMapping("/{email}")
    public ResponseEntity<User> buscarPorEmail(@PathVariable String email) {
        Optional<User> user = userService.buscarPorEmail(email);
        return user.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }
 // DTO Auxiliar para o Login
    public static class LoginDTO {
        public String email;
        public String senha;
    }

    // Endpoint de Login Oficial
    @PostMapping("/login")
    public ResponseEntity<?> fazerLogin(@RequestBody LoginDTO loginData) {
        Optional<User> userLogado = userService.autenticar(loginData.email, loginData.senha);

        if (userLogado.isPresent()) {
            // Sucesso
            return ResponseEntity.ok(userLogado.get());
        } else {
            // Falha - Erro 401 (Não Autorizado)
            return ResponseEntity.status(401).body("Credenciais inválidas. Verifique seu e-mail e senha.");
        }
    }
}