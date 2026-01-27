package com.caoradar.backend.repository;

import com.caoradar.backend.model.RelatoPerda;
import com.caoradar.backend.model.StatusRelato;
import com.caoradar.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RelatoPerdaRepository extends JpaRepository<RelatoPerda, UUID> {

	List<RelatoPerda> findByTutor(User tutor);

	List<RelatoPerda> findByStatus(StatusRelato status);

	// (Fórmula de Haversine) BUSCA GEOESPACIAL (Raio em KM) Calcula a distância entre a lat/long do cão perdido e a lat/long da câmera
	@Query("SELECT r FROM RelatoPerda r WHERE " + "r.status = 'EM_BUSCA' AND "
			+ "(6371 * acos(cos(radians(:lat)) * cos(radians(r.latitude)) * "
			+ "cos(radians(r.longitude) - radians(:lon)) + "
			+ "sin(radians(:lat)) * sin(radians(r.latitude)))) < :raioKm")
	List<RelatoPerda> buscarPorRaio(@Param("lat") Double lat, @Param("lon") Double lon, @Param("raioKm") Double raioKm);
}