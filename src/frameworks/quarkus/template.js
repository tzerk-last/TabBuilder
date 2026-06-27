// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const QUARKUS = {
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
  };

module.exports = { QUARKUS };
