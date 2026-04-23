# Estágio 1: Build (Compila o código usando o Maven)
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio 2: Run (Roda o projeto compilado num Java limpo)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copia o arquivo .jar gerado no passo anterior
COPY --from=build /app/target/*.jar app.jar
# Expõe a porta que o Render vai usar
EXPOSE 8080
# Comando para iniciar o Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]