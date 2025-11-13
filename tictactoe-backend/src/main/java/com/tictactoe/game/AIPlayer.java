package com.tictactoe.game;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class AIPlayer {
    
    private static final Random RANDOM = new Random();
    private static final int[][] WINNING_LINES = Game.WINNING_LINES; // Assuming WINNING_LINES is made public static in Game.java
                                                                    // *Note: I made it private in Game.java, so let's redeclare it here for this example*
    
    private static final int[][] AI_WINNING_LINES = {
        {0, 1, 2}, {3, 4, 5}, {6, 7, 8}, 
        {0, 3, 6}, {1, 4, 7}, {2, 5, 8}, 
        {0, 4, 8}, {2, 4, 6}             
    };

    /**
     * Determines the AI's next move based on difficulty.
     * @param board The current game board.
     * @param difficulty The AI difficulty level.
     * @return The index of the move (0-8).
     */
    public static int getNextMove(String[] board, Game.AIDifficulty difficulty) {
        List<Integer> availableMoves = getAvailableMoves(board);
        
        if (availableMoves.isEmpty()) {
            return -1; // Should not happen in a valid game state
        }
        
        switch (difficulty) {
            case HARD:
                return getMinimaxMove(board, availableMoves);
            case MEDIUM:
                // 70% chance of a smart move, 30% random
                if (RANDOM.nextDouble() < 0.7) {
                    return getSmartMove(board, availableMoves);
                }
                return getRandomMove(availableMoves);
            case EASY:
            default:
                // 20% chance of a smart move, 80% random
                if (RANDOM.nextDouble() < 0.2) {
                    return getSmartMove(board, availableMoves);
                }
                return getRandomMove(availableMoves);
        }
    }

    private static List<Integer> getAvailableMoves(String[] board) {
        List<Integer> moves = new ArrayList<>();
        for (int i = 0; i < 9; i++) {
            if (board[i] == null) {
                moves.add(i);
            }
        }
        return moves;
    }

    private static int getRandomMove(List<Integer> availableMoves) {
        return availableMoves.get(RANDOM.nextInt(availableMoves.size()));
    }

    /**
     * Attempts to win, then attempts to block. Otherwise, returns a random move.
     */
    private static int getSmartMove(String[] board, List<Integer> availableMoves) {
        // 1. Try to win (for 'O')
        int winningMove = findWinningOrBlockingMove(board, "O", availableMoves);
        if (winningMove != -1) {
            return winningMove;
        }

        // 2. Try to block 'X'
        int blockingMove = findWinningOrBlockingMove(board, "X", availableMoves);
        if (blockingMove != -1) {
            return blockingMove;
        }

        // 3. Take the center (4) if available
        if (availableMoves.contains(4)) {
            return 4;
        }

        // 4. Take a corner (0, 2, 6, 8) if available
        List<Integer> corners = new ArrayList<>();
        if (availableMoves.contains(0)) corners.add(0);
        if (availableMoves.contains(2)) corners.add(2);
        if (availableMoves.contains(6)) corners.add(6);
        if (availableMoves.contains(8)) corners.add(8);
        if (!corners.isEmpty()) {
            return getRandomMove(corners);
        }

        // 5. Random move
        return getRandomMove(availableMoves);
    }
    
    private static int findWinningOrBlockingMove(String[] board, String player, List<Integer> availableMoves) {
        for (int move : availableMoves) {
            String[] tempBoard = board.clone();
            tempBoard[move] = player;
            if (checkIfWinner(tempBoard, player)) {
                return move;
            }
        }
        return -1;
    }

    private static boolean checkIfWinner(String[] board, String player) {
        for (int[] line : AI_WINNING_LINES) {
            if (player.equals(board[line[0]]) && player.equals(board[line[1]]) && player.equals(board[line[2]])) {
                return true;
            }
        }
        return false;
    }

    // Minimax implementation for HARD difficulty (simple version)
    private static int getMinimaxMove(String[] board, List<Integer> availableMoves) {
        int bestScore = Integer.MIN_VALUE;
        int bestMove = -1;

        for (int move : availableMoves) {
            String[] newBoard = board.clone();
            newBoard[move] = "O"; // AI is 'O'
            
            int score = minimax(newBoard, 0, false);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove == -1 ? getRandomMove(availableMoves) : bestMove;
    }

    // Minimax recursive function (scores: 10=Win, -10=Loss, 0=Draw)
    private static int minimax(String[] board, int depth, boolean isMaximizingPlayer) {
        String winner = getBoardWinner(board);
        
        if (winner != null) {
            if (winner.equals("O")) return 10; // AI Win
            if (winner.equals("X")) return -10; // Player Win
            if (winner.equals("Draw")) return 0; // Draw
        }

        List<Integer> moves = getAvailableMoves(board);
        if (moves.isEmpty()) return 0; // Should be caught by the check above

        if (isMaximizingPlayer) {
            int maxEval = Integer.MIN_VALUE;
            for (int move : moves) {
                String[] newBoard = board.clone();
                newBoard[move] = "O";
                int eval = minimax(newBoard, depth + 1, false);
                maxEval = Math.max(maxEval, eval);
            }
            return maxEval;
        } else {
            int minEval = Integer.MAX_VALUE;
            for (int move : moves) {
                String[] newBoard = board.clone();
                newBoard[move] = "X";
                int eval = minimax(newBoard, depth + 1, true);
                minEval = Math.min(minEval, eval);
            }
            return minEval;
        }
    }
    
    private static String getBoardWinner(String[] board) {
        for (int[] line : AI_WINNING_LINES) {
            String a = board[line[0]];
            if (a != null && a.equals(board[line[1]]) && a.equals(board[line[2]])) {
                return a;
            }
        }
        if (getAvailableMoves(board).isEmpty()) {
            return "Draw";
        }
        return null;
    }
}