package com.caoradar.backend.repository;

import com.caoradar.backend.model.Camera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CameraRepository extends JpaRepository<Camera, UUID> {
    
    Optional<Camera> findByCodigoExterno(String codigoExterno);
    
    long countByAtivaTrue();
}