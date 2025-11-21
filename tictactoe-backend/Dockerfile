# ------------------ BUILD STAGE ------------------
FROM eclipse-temurin:17-jdk AS build

# Set working directory
WORKDIR /app

# Copy backend project files
COPY . .

# Install Maven, build Spring Boot JAR, and clean up
RUN apt-get update \
    && apt-get install -y --no-install-recommends maven \
    && mvn clean package -DskipTests \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ------------------ RUN STAGE ------------------
FROM eclipse-temurin:17-jre

# Set working directory
WORKDIR /app

# Copy only the built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port your Spring Boot app runs on
EXPOSE 8080

# Start the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
