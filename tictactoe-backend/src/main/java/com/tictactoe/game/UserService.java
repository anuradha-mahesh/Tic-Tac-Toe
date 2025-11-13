package com.tictactoe.game;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class UserService {

    // Simulates a database table for users
    private final Map<String, User> userMap = new ConcurrentHashMap<>(); // Key: username
    private final Map<Long, User> userByIdMap = new ConcurrentHashMap<>(); // Key: userId
    private final AtomicLong nextId = new AtomicLong(1);

    // Guest user for non-logged-in play
    private final User guestUser;

    public UserService() {
        // Initialize Guest User (ID 0)
        guestUser = new User(0L, "Guest");
        userByIdMap.put(0L, guestUser);
    }

    /**
     * Finds or creates a user. Acts as the login/register method.
     */
    public User loginOrRegister(String username) {
        if (username == null || username.trim().isEmpty()) {
            return guestUser;
        }
        
        // Find existing user
        User user = userMap.get(username);
        if (user != null) {
            return user;
        }

        // Create new user (simulated registration)
        Long id = nextId.getAndIncrement();
        User newUser = new User(id, username);
        userMap.put(username, newUser);
        userByIdMap.put(id, newUser);
        return newUser;
    }

    public User getUserById(Long userId) {
        if (userId == null) return guestUser;
        return userByIdMap.getOrDefault(userId, guestUser);
    }
    
    /**
     * Updates user stats after a game ends.
     * @param userId The ID of the user.
     * @param outcome The winner ("X" or "O") or "Draw".
     */
    public void updateStats(Long userId, String outcome) {
        User user = getUserById(userId);
        if (user != guestUser) { // Don't track stats for guests
            user.updateStats(outcome);
            // In a real app, you would save the 'user' object to the database here.
            // Since we're using in-memory, the changes are already applied to the user object.
        }
    }
    
    public User.UserStats getUserStats(Long userId) {
        User user = getUserById(userId);
        return new User.UserStats(user);
    }
}