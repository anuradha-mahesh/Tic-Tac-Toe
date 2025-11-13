package com.tictactoe.game;

import java.util.Arrays;
import java.util.List;

public class Game {
    
    // Game state fields
    private String[] board = new String[9];
    private String currentPlayer = "X";
    private String winner = null;
    private List<Integer> winningLine = List.of();
    
    // New fields for mode and difficulty
    private GameMode mode = GameMode.TWO_PLAYER;
    private AIDifficulty difficulty = AIDifficulty.MEDIUM;
    
    // NEW FIELD: ID for Player O (will be set when O joins a two-player game)
    private Long playerOId; 

    // FIX: Changed from 'private' to 'public' to allow AIPlayer access
    public static final int[][] WINNING_LINES = { 
        {0, 1, 2}, {3, 4, 5}, {6, 7, 8}, 
        {0, 3, 6}, {1, 4, 7}, {2, 5, 8}, 
        {0, 4, 8}, {2, 4, 6}             
    };

    public Game() {
        Arrays.fill(board, null);
    }
    
    // New Enums for Game Mode and Difficulty
    public enum GameMode {
        TWO_PLAYER, SINGLE_PLAYER
    }
    public enum AIDifficulty {
        EASY, MEDIUM, HARD
    }
    
    public boolean makeMove(int index) {
        
        if (winner != null || index < 0 || index >= 9 || board[index] != null) {
            return false; 
        }

        board[index] = currentPlayer;
        
        checkWin();

        if (winner == null) {
            
            // Only switch player if no winner/draw
            currentPlayer = currentPlayer.equals("X") ? "O" : "X";
        }
        
        return true;
    }

    // New method to check if the board is full (Draw condition)
    public boolean isBoardFull() {
        return Arrays.stream(board).allMatch(s -> s != null);
    }

    private void checkWin() {
        for (int[] line : WINNING_LINES) {
            String a = board[line[0]];
            String b = board[line[1]];
            String c = board[line[2]];
            
            if (a != null && a.equals(b) && a.equals(c)) {
                winner = a; // Found a winner
                winningLine = List.of(line[0], line[1], line[2]);
                return;
            }
        }
        
        if (isBoardFull() && winner == null) {
            winner = "Draw";
        }
    }
    
    // --- Getters and Setters (updated) ---
    public String[] getBoard() { return board; }
    public String getCurrentPlayer() { return currentPlayer; }
    public String getWinner() { return winner; }
    public List<Integer> getWinningLine() { return winningLine; }
    public GameMode getMode() { return mode; }
    public AIDifficulty getDifficulty() { return difficulty; }
    
    // NEW GETTER/SETTER for Player O ID
    public Long getPlayerOId() { return playerOId; }
    public void setPlayerOId(Long playerOId) { this.playerOId = playerOId; }

    public void setBoard(String[] board) { this.board = board; }
    public void setCurrentPlayer(String currentPlayer) { this.currentPlayer = currentPlayer; }
    public void setWinner(String winner) { this.winner = winner; }
    public void setWinningLine(List<Integer> winningLine) { this.winningLine = winningLine; }
    public void setMode(GameMode mode) { this.mode = mode; }
    public void setDifficulty(AIDifficulty difficulty) { this.difficulty = difficulty; }
    
    public void restart() {
        Arrays.fill(board, null);
        currentPlayer = "X";
        winner = null;
        winningLine = List.of();
        // Reset player O ID on restart (so a new player O can join)
        // playerOId = null; 
    }
}