// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const MICRONAUT = {
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
  };

module.exports = { MICRONAUT };
