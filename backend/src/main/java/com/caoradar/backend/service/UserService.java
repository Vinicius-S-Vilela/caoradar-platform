package com.caoradar.backend.service;

import com.caoradar.backend.model.User;
import com.caoradar.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User salvar(User user) {
        // Remove tudo que não for número (0 a 9) do CPF
        if (user.getCpf() != null) {
            user.setCpf(user.getCpf().replaceAll("[^0-9]", ""));
        }
        return userRepository.save(user);
    }
    public Optional<User> buscarPorEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> buscarPorId(java.util.UUID id) {
        return userRepository.findById(id);
    }
    public Optional<User> autenticar(String email, String senha) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPasswordHash().equals(senha)) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }
}