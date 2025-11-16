package com.tictactoe.game;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;

import com.tictactoe.game.Game.AIDifficulty;
import com.tictactoe.game.Game.GameMode;
import com.tictactoe.game.User.UserStats;


@CrossOrigin(origins = "http://localhost:3000") 
@RestController
@RequestMapping("/api") // Base mapping for all API endpoints
public class GameController {

    @Autowired
    private UserService userService; 

    // --- User/Authentication Endpoints ---

    @PostMapping("/users/login")
    public ResponseEntity<User> login(@RequestParam String username) {
        User user = userService.loginOrRegister(username);
        return ResponseEntity.ok(user);
    }
    
    @GetMapping("/users/stats")
    public ResponseEntity<UserStats> getUserStats(@RequestParam Long userId) {
        UserStats stats = userService.getUserStats(userId);
        return ResponseEntity.ok(stats);
    }
    
    // NEW ENDPOINT: Player O logs in and joins the game
    @PostMapping("/game/join")
    public ResponseEntity<User> joinGame(
        @RequestParam Long userIdX,     // The ID of Player X (the existing user)
        @RequestParam String usernameO   // The username of Player O
    ) {
        User userX = userService.getUserById(userIdX);
        
        // Login/Register Player O
        User userO = userService.loginOrRegister(usernameO);
        
        // Link Player O's ID to Player X's game object
        userX.getGame().setPlayerOId(userO.getId());

        // Return Player O's details to the frontend for display/confirmation
        return ResponseEntity.ok(userO);
    }

    // --- Game Endpoints ---

    @GetMapping("/game")
    public Game getGameStatus(
        @RequestParam Long userId,
        @RequestParam GameMode mode
    ) {
        User user = userService.getUserById(userId);
        user.getGame().setMode(mode); // Set the mode on the current game
        return user.getGame();
    }

    @PostMapping("/move")
    public ResponseEntity<Game> makeMove(
        @RequestParam int index,
        @RequestParam Long userId,
        @RequestParam GameMode mode,
        @RequestParam AIDifficulty difficulty // Only relevant for single player
    ) {
        User user = userService.getUserById(userId);
        Game game = user.getGame();
        game.setMode(mode);
        game.setDifficulty(difficulty); // Set difficulty in case it changed

        // 1. Process Player Move
        if (game.getWinner() != null) {
            return ResponseEntity.badRequest().body(game); 
        }

        // Only enforce 'X' turn if in SINGLE_PLAYER mode (because 'O' is the AI)
        if (mode == GameMode.SINGLE_PLAYER && !game.getCurrentPlayer().equals("X")) {
            return ResponseEntity.badRequest().body(game); // It's AI's turn
        }

        boolean success = game.makeMove(index);
        if (!success) { 
             return ResponseEntity.badRequest().body(game);
        }
        
        // 2. Check for Win/Draw after player move (X or O)
        if (game.getWinner() != null) {
            
            String winnerSymbol = game.getWinner();
            Long playerXId = userId;
            Long playerOId = game.getPlayerOId();
            
            if (winnerSymbol.equals("Draw")) {
                // Draw: Update stats for X, and for O if they are logged in (two-player mode)
                userService.updateStats(playerXId, "Draw");
                if (game.getMode() == GameMode.TWO_PLAYER && playerOId != null) {
                    userService.updateStats(playerOId, "Draw");
                }
            } else if (winnerSymbol.equals("X")) {
                // X Wins: Update X's stats for Win, and O's stats for Loss
                userService.updateStats(playerXId, "X");
                if (game.getMode() == GameMode.TWO_PLAYER && playerOId != null) {
                    userService.updateStats(playerOId, "O"); // 'O' is the loser
                }
            } else if (winnerSymbol.equals("O")) {
                // O Wins: Update X's stats for Loss, and O's stats for Win
                userService.updateStats(playerXId, "O"); // 'X' is the loser
                if (game.getMode() == GameMode.TWO_PLAYER && playerOId != null) {
                    userService.updateStats(playerOId, "X"); // 'X' is the winning outcome for player O
                }
            }
            return ResponseEntity.ok(game);
        }


        // 3. Process AI Move if in Single Player mode
        if (mode == GameMode.SINGLE_PLAYER && game.getCurrentPlayer().equals("O")) {
            
            // UX FIX: Add 1-second delay for a better user experience
            try {
                Thread.sleep(1000); // Pause for 1 second
            } catch (InterruptedException e) {
                // If the thread is interrupted, restore the interrupt status
                Thread.currentThread().interrupt();
            }
            
            int aiMoveIndex = AIPlayer.getNextMove(game.getBoard(), difficulty);
            
            if (aiMoveIndex != -1) {
                game.makeMove(aiMoveIndex); // AI always makes a valid move
            }
            
            // 4. Check for Win/Draw after AI move (Stats update is handled by the unified block above if game ends)
            if (game.getWinner() != null) {
                // AI/O Wins: Update X's stats for Loss, 'O' (AI) does not have stats to update
                if (game.getWinner().equals("O")) {
                    userService.updateStats(userId, "O"); 
                } else if (game.getWinner().equals("Draw")) {
                    userService.updateStats(userId, "Draw");
                }
            }
        }
        
        // Return the final game state (after human and potentially AI move)
        return ResponseEntity.ok(game);
    }

    @PostMapping("/restart")
    public Game restartGame(
        @RequestParam Long userId,
        @RequestParam GameMode mode
    ) {
        User user = userService.getUserById(userId);
        Game game = user.getGame();
        game.setMode(mode);
        game.restart();
        return game;
    }
}