package com.caoradar.backend.controller;

import com.caoradar.backend.model.Camera;
import com.caoradar.backend.repository.CameraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cameras")
public class CameraController {

    @Autowired
    private CameraRepository cameraRepository;

    @GetMapping
    public ResponseEntity<List<Camera>> listarCameras() {
        List<Camera> cameras = cameraRepository.findAll();
        return ResponseEntity.ok(cameras);
    }

    @GetMapping("/ativas")
    public ResponseEntity<List<Camera>> listarCamerasAtivas() {
        List<Camera> cameras = cameraRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getAtiva()))
                .toList();
        return ResponseEntity.ok(cameras);
    }
}
