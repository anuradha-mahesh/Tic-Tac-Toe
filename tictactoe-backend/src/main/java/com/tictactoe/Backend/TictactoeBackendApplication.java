package com.tictactoe.Backend; 

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;


@SpringBootApplication

@ComponentScan(basePackages = "com.tictactoe")
public class TictactoeBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TictactoeBackendApplication.class, args);
        System.out.println("Tic-Tac-Toe Backend Server is running on port 8080!");
    }
}