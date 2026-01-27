package com.caoradar.backend.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tb_relatos_perda")
public class RelatoPerda extends BaseEntity {

	// Um relato pertence a um tutor
	@ManyToOne
	@JoinColumn(name = "tutor_id", nullable = false)
	private User tutor;

	@Column(nullable = false)
	private String nomeCao;

	@Column(columnDefinition = "TEXT")
	private String descricao;

	// LISTA DE FOTOS
	@ElementCollection
	@CollectionTable(name = "tb_relato_fotos", joinColumns = @JoinColumn(name = "relato_id"))
	@Column(name = "foto_url")
	private List<String> fotosUrl;

	// GEOLOCALIZAÇÃO
	private Double latitude;
	private Double longitude;

	private LocalDateTime dataDesaparecimento;

	@Enumerated(EnumType.STRING)
	private StatusRelato status;

	// METADADOS PARA FILTRO RÁPIDO
	private String porteInformado;
	private String corPredominante;

	public User getTutor() {
		return tutor;
	}

	public void setTutor(User tutor) {
		this.tutor = tutor;
	}

	public String getNomeCao() {
		return nomeCao;
	}

	public void setNomeCao(String nomeCao) {
		this.nomeCao = nomeCao;
	}

	public String getDescricao() {
		return descricao;
	}

	public void setDescricao(String descricao) {
		this.descricao = descricao;
	}

	public List<String> getFotosUrl() {
		return fotosUrl;
	}

	public void setFotosUrl(List<String> fotosUrl) {
		this.fotosUrl = fotosUrl;
	}

	public Double getLatitude() {
		return latitude;
	}

	public void setLatitude(Double latitude) {
		this.latitude = latitude;
	}

	public Double getLongitude() {
		return longitude;
	}

	public void setLongitude(Double longitude) {
		this.longitude = longitude;
	}

	public LocalDateTime getDataDesaparecimento() {
		return dataDesaparecimento;
	}

	public void setDataDesaparecimento(LocalDateTime dataDesaparecimento) {
		this.dataDesaparecimento = dataDesaparecimento;
	}

	public StatusRelato getStatus() {
		return status;
	}

	public void setStatus(StatusRelato status) {
		this.status = status;
	}

	public String getPorteInformado() {
		return porteInformado;
	}

	public void setPorteInformado(String porteInformado) {
		this.porteInformado = porteInformado;
	}

	public String getCorPredominante() {
		return corPredominante;
	}

	public void setCorPredominante(String corPredominante) {
		this.corPredominante = corPredominante;
	}
}