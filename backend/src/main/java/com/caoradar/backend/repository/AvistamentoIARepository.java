package com.caoradar.backend.repository;

import com.caoradar.backend.model.AvistamentoIA;
import com.caoradar.backend.model.Camera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AvistamentoIARepository extends JpaRepository<AvistamentoIA, UUID> {

    List<AvistamentoIA> findByCameraOrigemAndDataHoraAfter(Camera camera, LocalDateTime dataLimite);
}