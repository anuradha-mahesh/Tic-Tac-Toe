package com.tictactoe.game;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.http.ResponseEntity;


@CrossOrigin(origins = "http://localhost:3000") 
@RestController
public class GameController {

    
    private Game game = new Game();

    
    @GetMapping("/game")
    public Game getGameStatus() {
        return game;
    }

    
    @PostMapping("/move")
    public ResponseEntity<Game> makeMove(@RequestParam int index) {
        
        boolean success = game.makeMove(index);
        
        if (success) { 
            return ResponseEntity.ok(game);
        } else {
            
            return ResponseEntity.badRequest().body(game);
        }
    }

    
    @PostMapping("/restart")
    public Game restartGame() {
        game.restart();
        return game;
    }
}