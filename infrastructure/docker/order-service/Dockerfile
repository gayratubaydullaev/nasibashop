FROM gradle:8.10.2-jdk21 AS build
WORKDIR /src

COPY services/order-service ./services/order-service
WORKDIR /src/services/order-service
RUN gradle --no-daemon clean bootJar

FROM eclipse-temurin:21-jre
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /src/services/order-service/build/libs/*.jar /app/order-service.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/order-service.jar"]
