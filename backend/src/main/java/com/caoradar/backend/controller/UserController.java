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
}