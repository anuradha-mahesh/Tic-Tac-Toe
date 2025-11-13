package com.tictactoe.game;

// Use Lombok annotations for real projects, but for this, standard POJO
public class User {
    
    private Long id;
    private String username;
    private int totalWins = 0;
    private int totalLosses = 0;
    private int totalDraws = 0;
    private int currentStreak = 0; // Current win streak
    private int bestStreak = 0; // Personal best win streak

    // Current Game state linked to the user
    private Game game; 

    public User(Long id, String username) {
        this.id = id;
        this.username = username;
        this.game = new Game(); // Initialize a new game for the user
    }

    public void updateStats(String outcome) {
        // outcome will be "X", "O", or "Draw"
        if (outcome.equals("X")) {
            this.totalWins++;
            this.currentStreak++;
            if (this.currentStreak > this.bestStreak) {
                this.bestStreak = this.currentStreak;
            }
        } else if (outcome.equals("O")) {
            this.totalLosses++;
            this.currentStreak = 0; // Streak broken
        } else if (outcome.equals("Draw")) {
            this.totalDraws++;
            // Streak is maintained for draw if the requirement is only to break on a loss
            // We'll reset it to 0 on a draw for simplicity, as "wins in a row" implies only wins count.
            this.currentStreak = 0; 
        }
    }

    // --- Getters and Setters ---
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public int getTotalWins() { return totalWins; }
    public int getTotalLosses() { return totalLosses; }
    public int getTotalDraws() { return totalDraws; }
    public int getBestStreak() { return bestStreak; }
    public Game getGame() { return game; }
    
    // Note: No setter for 'id' or 'username' typically
    public void setTotalWins(int totalWins) { this.totalWins = totalWins; }
    public void setTotalLosses(int totalLosses) { this.totalLosses = totalLosses; }
    public void setTotalDraws(int totalDraws) { this.totalDraws = totalDraws; }
    public void setBestStreak(int bestStreak) { this.bestStreak = bestStreak; }
    public void setCurrentStreak(int currentStreak) { this.currentStreak = currentStreak; }
    public void setGame(Game game) { this.game = game; }
    
    // DTO for frontend stats
    public static class UserStats { // CORRECT: static keyword is present
        public int totalWins;
        public int totalLosses;
        public int totalDraws;
        public int bestStreak;
        
        public UserStats(User user) {
            this.totalWins = user.totalWins;
            this.totalLosses = user.totalLosses;
            this.totalDraws = user.totalDraws;
            this.bestStreak = user.bestStreak;
        }
    }
}