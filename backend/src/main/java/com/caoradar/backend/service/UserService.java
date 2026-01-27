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
        return userRepository.save(user);
    }

    public Optional<User> buscarPorEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> buscarPorId(java.util.UUID id) {
        return userRepository.findById(id);
    }
}