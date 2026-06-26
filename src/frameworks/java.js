// @ts-check
'use strict';

/** @type {Record<string, import('../types').FrameworkTemplate>} */
const JAVA_FRAMEWORKS = {
  'spring-boot': {
    id: 'spring-boot',
    name: 'Spring Boot',
    icon: '🌱',
    lang: 'java',
    description: 'Framework empresarial para Java con auto-configuración',
    version: '4.x',
    port: 8080,
    enabled: true,
    templates: ['mvc', 'clean', 'api'],
    architectures: ['standard', 'clean', 'api'],
    enabled: true,
    templates: ['mvc'],
    architectures: ['standard', 'clean'],
    folders: [
      'src/main/java/com/example/app',
      'src/main/resources',
      'src/test/java/com/example/app',
    ],
    files: {
      'src/main/java/com/example/app/Application.java':
`package com.example.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
`,
      'src/main/java/com/example/app/HelloController.java':
`package com.example.app;

import org.springframework.web.bind.annotation.*;

@RestController
public class HelloController {
    @GetMapping("/")
    public String hello() { return "Hello from {PROJECT_NAME}!"; }

    @GetMapping("/health")
    public String health() { return "OK"; }
}
`,
      'src/main/resources/application.properties':
`server.port=8080
spring.application.name={PROJECT_NAME}
logging.level.root=INFO
`,
      'src/main/resources/application-dev.properties':
`spring.devtools.restart.enabled=true
logging.level.com.example=DEBUG
`,
      'src/test/java/com/example/app/ApplicationTest.java':
`package com.example.app;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ApplicationTest {
    @Test
    void contextLoads() {}
}
`,
      'pom.xml':
`<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.5</version>
  </parent>
  <groupId>com.example</groupId>
  <artifactId>{PROJECT_NAME}</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <properties>
    <java.version>21</java.version>
  </properties>
  <dependencies>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-devtools</artifactId><scope>runtime</scope><optional>true</optional></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin>
    </plugins>
  </build>
</project>
`,
      '.env.example': `SPRING_PROFILES_ACTIVE=dev\n`,
    },
  },

  'quarkus': {
    id: 'quarkus',
    name: 'Quarkus',
    icon: '⚡',
    lang: 'java',
    description: 'Framework supersónico y subatómico para Java',
    version: '3.x',
    port: 8080,
    enabled: false,
    templates: ['api'],
    architectures: ['standard'],
    enabled: false,
    templates: ['api'],
    architectures: ['standard'],
    folders: ['src/main/java/com/example', 'src/main/resources', 'src/test/java/com/example'],
    files: {
      'src/main/java/com/example/GreetingResource.java':
`package com.example;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/hello")
public class GreetingResource {
    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String hello() { return "Hello from {PROJECT_NAME}!"; }

    @GET
    @Path("/health")
    @Produces(MediaType.TEXT_PLAIN)
    public String health() { return "OK"; }
}
`,
      'src/main/resources/application.properties':
`quarkus.application.name={PROJECT_NAME}
quarkus.http.port=8080
quarkus.log.level=INFO
`,
      'src/test/java/com/example/GreetingResourceTest.java':
`package com.example;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import org.junit.jupiter.api.Test;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
class GreetingResourceTest {
    @Test
    void testHelloEndpoint() {
        RestAssured.given()
            .when().get("/hello")
            .then().statusCode(200).body(is("Hello from {PROJECT_NAME}!"));
    }
}
`,
      'pom.xml':
`<?xml version="1.0"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>{PROJECT_NAME}</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>jar</packaging>
  <properties>
    <quarkus.platform.artifact-id>quarkus-bom</quarkus.platform.artifact-id>
    <quarkus.platform.group-id>io.quarkus.platform</quarkus.platform.group-id>
    <quarkus.platform.version>3.17.4</quarkus.platform.version>
    <java.version>21</java.version>
  </properties>
  <dependencyManagement>
    <dependencies>
      <dependency><groupId>\${quarkus.platform.group-id}</groupId><artifactId>\${quarkus.platform.artifact-id}</artifactId><version>\${quarkus.platform.version}</version><type>pom</type><scope>import</scope></dependency>
    </dependencies>
  </dependencyManagement>
  <dependencies>
    <dependency><groupId>io.quarkus</groupId><artifactId>quarkus-rest</artifactId></dependency>
    <dependency><groupId>io.quarkus</groupId><artifactId>quarkus-junit5</artifactId><scope>test</scope></dependency>
    <dependency><groupId>io.rest-assured</groupId><artifactId>rest-assured</artifactId><scope>test</scope></dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin><groupId>io.quarkus.platform</groupId><artifactId>quarkus-maven-plugin</artifactId><version>\${quarkus.platform.version}</version><extensions>true</extensions></plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <configuration>
          <source>21</source>
          <target>21</target>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
`,
    },
  },

  'micronaut': {
    id: 'micronaut',
    name: 'Micronaut',
    icon: '🔬',
    lang: 'java',
    description: 'Framework moderno JVM con inicio rápido',
    version: '4.x',
    port: 8080,
    enabled: false,
    templates: ['api'],
    architectures: ['standard'],
    enabled: false,
    templates: ['api'],
    architectures: ['standard'],
    folders: ['src/main/java/com/example', 'src/main/resources', 'src/test/java/com/example'],
    files: {
      'src/main/java/com/example/Application.java':
`package com.example;

import io.micronaut.runtime.Micronaut;

public class Application {
    public static void main(String[] args) { Micronaut.run(Application.class, args); }
}
`,
      'src/main/java/com/example/HelloController.java':
`package com.example;

import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.*;

@Controller("/hello")
public class HelloController {
    @Get(produces = MediaType.TEXT_PLAIN)
    public String index() { return "Hello from {PROJECT_NAME}!"; }

    @Get(value = "/health", produces = MediaType.TEXT_PLAIN)
    public String health() { return "OK"; }
}
`,
      'src/main/resources/application.yml':
`micronaut:
  application:
    name: {PROJECT_NAME}
  server:
    port: 8080
`,
      'pom.xml':
`<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>{PROJECT_NAME}</artifactId>
  <version>0.1</version>
  <packaging>jar</packaging>
  <parent>
    <groupId>io.micronaut.platform</groupId>
    <artifactId>micronaut-parent</artifactId>
    <version>4.7.6</version>
  </parent>
  <properties>
    <jdk.version>21</jdk.version>
    <maven.compiler.source>21</maven.compiler.source>
    <maven.compiler.target>21</maven.compiler.target>
    <micronaut.runtime>netty</micronaut.runtime>
    <micronaut.aot.enabled>false</micronaut.aot.enabled>
  </properties>
  <dependencies>
    <dependency><groupId>io.micronaut</groupId><artifactId>micronaut-http-server-netty</artifactId><scope>compile</scope></dependency>
    <dependency><groupId>ch.qos.logback</groupId><artifactId>logback-classic</artifactId><scope>runtime</scope></dependency>
    <dependency><groupId>io.micronaut.test</groupId><artifactId>micronaut-test-junit5</artifactId><scope>test</scope></dependency>
    <dependency><groupId>org.junit.jupiter</groupId><artifactId>junit-jupiter-api</artifactId><scope>test</scope></dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin><groupId>io.micronaut.maven</groupId><artifactId>micronaut-maven-plugin</artifactId></plugin>
    </plugins>
  </build>
</project>
`,
    },
  },
};

module.exports = { JAVA_FRAMEWORKS };
