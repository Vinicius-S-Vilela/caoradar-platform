package com.caoradar.backend.model;

import java.io.Serializable;
import java.util.List;

public class MetadadosVisuais implements Serializable {

	// JSON que vem do Python
	private static final long serialVersionUID = 1L;
	private String racaEstimada;
	private String corPredominante;
	private String porteEstimado;
	private Double confiancaDetecao;
	private List<String> caracteristicasExtras;

	// Construtor vazio obrigatório para o Jackson/Hibernate
	public MetadadosVisuais() {
	}

	public String getRacaEstimada() {
		return racaEstimada;
	}

	public void setRacaEstimada(String racaEstimada) {
		this.racaEstimada = racaEstimada;
	}

	public String getCorPredominante() {
		return corPredominante;
	}

	public void setCorPredominante(String corPredominante) {
		this.corPredominante = corPredominante;
	}

	public String getPorteEstimado() {
		return porteEstimado;
	}

	public void setPorteEstimado(String porteEstimado) {
		this.porteEstimado = porteEstimado;
	}

	public Double getConfiancaDetecao() {
		return confiancaDetecao;
	}

	public void setConfiancaDetecao(Double confiancaDetecao) {
		this.confiancaDetecao = confiancaDetecao;
	}

	public List<String> getCaracteristicasExtras() {
		return caracteristicasExtras;
	}

	public void setCaracteristicasExtras(List<String> caracteristicasExtras) {
		this.caracteristicasExtras = caracteristicasExtras;
	}
}