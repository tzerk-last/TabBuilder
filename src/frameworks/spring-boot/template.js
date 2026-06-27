// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const SPRING_BOOT = {
    id: 'spring-boot',
    name: 'Spring Boot',
    icon: '🌱',
    lang: 'java',
    description: 'Framework empresarial para Java con auto-configuración',
    version: '4.x',
    port: 8080,
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
  };

module.exports = { SPRING_BOOT };
