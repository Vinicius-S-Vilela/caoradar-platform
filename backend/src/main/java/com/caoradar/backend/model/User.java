package com.caoradar.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
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
}