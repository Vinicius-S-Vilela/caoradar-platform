CAORADAR - Sistema de Monitoramento e Resgate de Pets 🐶📡

Trabalho de Conclusão de Curso (TCC) - Ciência da Computação (USCS)

O CAORADAR é um sistema SaaS integrado à vigilância urbana (Smart Sanca) que utiliza Inteligência Artificial para identificar, classificar e localizar cães perdidos em tempo real.

🏗 Arquitetura do Projeto (Monorepo)

Este repositório contém todo o código fonte do projeto, organizado em microsserviços:

Diretório

Tecnologia

Responsabilidade

☕ /backend

Java 17 + Spring Boot

API REST, Regras de Negócio, Persistência e Gestão de Usuários.

🧠 /ia-service

Python + YOLOv8

Visão Computacional, Detecção, Classificação e Matching.

🎨 /frontend

Angular

Interface Web para Tutores (PWA) e Painel Administrativo.

📚 /docs

Markdown/PDF

Documentação técnica, diagramas e relatórios do TCC.

🚀 Como Rodar o Projeto (Docker)

Para subir todo o ambiente (Banco, Backend e IA) de uma vez, certifique-se de ter o Docker e Docker Compose instalados.

# Na raiz do projeto
docker-compose up --build


🛠 Tecnologias Utilizadas

Visão Computacional: Ultralytics YOLOv8

Backend: Spring Data JPA, Hibernate, Spring Security (JWT)

Banco de Dados: PostgreSQL (com suporte a JSONB)

Storage: Object Storage (Cloudinary/S3)

Infraestrutura: Docker, Render, NeonDB

👥 Autores

Pedro de Abreu

Douglas Primo

Vinicius Vilela

Gabriel Shoga

Giovanni Chiarelli

Universidade Municipal de São Caetano do Sul - 2024