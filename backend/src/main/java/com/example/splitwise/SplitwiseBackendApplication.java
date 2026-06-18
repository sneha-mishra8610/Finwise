package com.example.splitwise;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SplitwiseBackendApplication {

    @Autowired
    private MongoTemplate mongoTemplate;

    @PostConstruct
    public void checkDb() {
        System.out.println("DATABASE = " + mongoTemplate.getDb().getName());
        System.out.println("COLLECTIONS = " + mongoTemplate.getCollectionNames());
    }

    public static void main(String[] args) {
        SpringApplication.run(SplitwiseBackendApplication.class, args);
    }
}