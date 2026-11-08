# syntax=docker/dockerfile:1
# Build context = project root (see docker-compose.yml)
# Targets:  backend  (Java Spring Boot)  |  frontend  (Express.js)

# ---------- Backend: build ----------
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /build
COPY backend/pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -q dependency:go-offline
COPY backend/src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -q clean package -DskipTests

# ---------- Backend: runtime ----------
FROM eclipse-temurin:21-jre AS backend
WORKDIR /app
COPY --from=backend-build /build/target/*.war app.war
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.war"]

# ---------- Frontend: dependencies ----------
FROM node:22-alpine AS frontend-deps
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install --omit=dev

# ---------- Frontend: runtime ----------
FROM node:22-alpine AS frontend
ENV NODE_ENV=production
WORKDIR /app
COPY --from=frontend-deps /app/node_modules ./node_modules
COPY frontend/ .
EXPOSE 3000
USER node
CMD ["node", "server.js"]
