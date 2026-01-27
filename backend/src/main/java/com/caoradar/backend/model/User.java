package com.caoradar.backend.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true) // Compara usando o ID da BaseEntity
@Entity
@Table(name = "tb_users") // Nome da tabela no Postgres
public class User extends BaseEntity {

	@Column(nullable = false)
	private String nome;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(nullable = false)
	private String passwordHash;

	private String telefone;

	@Enumerated(EnumType.STRING)
	private Role role;

	public String getNome() {
		return nome;
	}

	public void setNome(String nome) {
		this.nome = nome;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public String getTelefone() {
		return telefone;
	}

	public void setTelefone(String telefone) {
		this.telefone = telefone;
	}

	public Role getRole() {
		return role;
	}

	public void setRole(Role role) {
		this.role = role;
	}
}