package com.caoradar.backend.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "tb_matches")
public class Match extends BaseEntity {

	// LIGAÇÃO COM O TUTOR
	@ManyToOne
	@JoinColumn(name = "relato_id", nullable = false)
	private RelatoPerda relato;

	// LIGAÇÃO COM A CÂMERA
	@ManyToOne
	@JoinColumn(name = "avistamento_id", nullable = false)
	private AvistamentoIA avistamento;

	// DADOS DA INTELIGÊNCIA ARTIFICIAL
	private Double scoreSimilaridade;

	@Column(columnDefinition = "TEXT") // Explicação do LLM
	private String explicacaoLLM;

	@Enumerated(EnumType.STRING)
	private StatusMatch status;

	public RelatoPerda getRelato() {
		return relato;
	}

	public void setRelato(RelatoPerda relato) {
		this.relato = relato;
	}

	public AvistamentoIA getAvistamento() {
		return avistamento;
	}

	public void setAvistamento(AvistamentoIA avistamento) {
		this.avistamento = avistamento;
	}

	public Double getScoreSimilaridade() {
		return scoreSimilaridade;
	}

	public void setScoreSimilaridade(Double scoreSimilaridade) {
		this.scoreSimilaridade = scoreSimilaridade;
	}

	public String getExplicacaoLLM() {
		return explicacaoLLM;
	}

	public void setExplicacaoLLM(String explicacaoLLM) {
		this.explicacaoLLM = explicacaoLLM;
	}

	public StatusMatch getStatus() {
		return status;
	}

	public void setStatus(StatusMatch status) {
		this.status = status;
	}
}