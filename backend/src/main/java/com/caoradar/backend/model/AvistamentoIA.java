package com.caoradar.backend.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tb_avistamentos_ia")
public class AvistamentoIA extends BaseEntity {

	@Column(nullable = false)
	private String snapshotUrl;

	private LocalDateTime dataHora;

	@ManyToOne
	@JoinColumn(name = "camera_origem_id")
	private Camera cameraOrigem;

	// PERSISTÊNCIA HÍBRIDA (JSONB)
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private MetadadosVisuais features;

	public String getSnapshotUrl() {
		return snapshotUrl;
	}

	public void setSnapshotUrl(String snapshotUrl) {
		this.snapshotUrl = snapshotUrl;
	}

	public LocalDateTime getDataHora() {
		return dataHora;
	}

	public void setDataHora(LocalDateTime dataHora) {
		this.dataHora = dataHora;
	}

	public Camera getCameraOrigem() {
		return cameraOrigem;
	}

	public void setCameraOrigem(Camera cameraOrigem) {
		this.cameraOrigem = cameraOrigem;
	}

	public MetadadosVisuais getFeatures() {
		return features;
	}

	public void setFeatures(MetadadosVisuais features) {
		this.features = features;
	}
}