package com.tictactoe.game;

import java.util.Arrays;
import java.util.List;

public class Game {
    
    
    private String[] board = new String[9];
    private String currentPlayer = "X";
    private String winner = null;
    private List<Integer> winningLine = List.of();

    private static final int[][] WINNING_LINES = {
        {0, 1, 2}, {3, 4, 5}, {6, 7, 8}, 
        {0, 3, 6}, {1, 4, 7}, {2, 5, 8}, 
        {0, 4, 8}, {2, 4, 6}             
    };

    public Game() {
        Arrays.fill(board, null);
    }

    
    public boolean makeMove(int index) {
        
        if (winner != null || index < 0 || index >= 9 || board[index] != null) {
            return false; 
        }

        board[index] = currentPlayer;
        
        checkWin();

        if (winner == null) {
            
            currentPlayer = currentPlayer.equals("X") ? "O" : "X";
        }
        
        return true;
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
        
        
        if (Arrays.stream(board).allMatch(s -> s != null) && winner == null) {
            winner = "Draw";
        }
    }

    
    
    public String[] getBoard() { return board; }
    public String getCurrentPlayer() { return currentPlayer; }
    public String getWinner() { return winner; }
    public List<Integer> getWinningLine() { return winningLine; }
    
    
    public void setBoard(String[] board) { this.board = board; }
    public void setCurrentPlayer(String currentPlayer) { this.currentPlayer = currentPlayer; }
    public void setWinner(String winner) { this.winner = winner; }
    public void setWinningLine(List<Integer> winningLine) { this.winningLine = winningLine; }
    
    
    public void restart() {
        Arrays.fill(board, null);
        currentPlayer = "X";
        winner = null;
        winningLine = List.of();
    }
}