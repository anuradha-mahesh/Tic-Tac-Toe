import React, { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, Circle, X, LogIn, LogOut, User, Cpu, Settings } from "lucide-react";

// In a real application, you'd use environment variables for this
const API_BASE_URL = "https://tic-tac-toe-eypu.onrender.com";
const App = () => {
    // --- State Management ---
    const [userX, setUserX] = useState(null); // Player X (Game Initiator)
    const [userO, setUserO] = useState(null); // Player O (Joined User) <--- NEW
    
    // Stats for both users
    const initialStats = { totalWins: 0, totalLosses: 0, totalDraws: 0, bestStreak: 0 };
    const [statsX, setStatsX] = useState(initialStats); // Stats for Player X <--- RENAMED
    const [statsO, setStatsO] = useState(initialStats); // Stats for Player O <--- NEW

    const [loginInput, setLoginInput] = useState("");
    const [playerOUsernameInput, setPlayerOUsernameInput] = useState(''); // Input for Player O's username <--- NEW

    const [game, setGame] = useState({
        board: Array(9).fill(null),
        currentPlayer: "X",
        winner: null,
        winningLine: [],
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState("TWO_PLAYER"); // TWO_PLAYER, SINGLE_PLAYER
    const [difficulty, setDifficulty] = useState("MEDIUM"); // EASY, MEDIUM, HARD
    const [showSettings, setShowSettings] = useState(false);

    // --- Authentication & Stats Logic ---

    // Load user from session/local storage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("tictactoeUserX"); // Changed key to 'UserX'
        if (storedUser) {
            setUserX(JSON.parse(storedUser));
        }
        setLoading(false); // Finished initial loading/auth check
    }, []);

    // Reusable function to fetch stats for any user ID
    const fetchStatsForUser = useCallback(async (userId, setStatsFn) => {
        if (!userId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/stats?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setStatsFn(data); // Use the provided setter function
            }
        } catch (e) {
            console.error("Failed to fetch stats:", e);
        }
    }, []);

    const updateAllStats = useCallback(() => {
        // Always update Player X stats
        if (userX) {
            fetchStatsForUser(userX.id, setStatsX);
        }
        // Update Player O stats if logged in
        if (userO) {
            fetchStatsForUser(userO.id, setStatsO);
        }
    }, [userX, userO, fetchStatsForUser, setStatsX, setStatsO]);


    const handleLogin = async () => {
        if (!loginInput) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/login?username=${loginInput}`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Login failed");
            
            const userData = await response.json();
            setUserX(userData); // Set as Player X
            localStorage.setItem("tictactoeUserX", JSON.stringify(userData)); // Store X's data
            setLoginInput("");
            fetchGameStatus(); // Reload game state after login

        } catch (e) {
            setError(e.message || "Could not log in. Check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setUserX(null);
        setUserO(null); // Logout Player O as well
        localStorage.removeItem("tictactoeUserX");
        setStatsX(initialStats);
        setStatsO(initialStats);
        // Force restart the game to clear playerOId on the backend
        handleRestart(); 
    };
    
    // NEW: Function to handle Player O joining the game
    const joinGame = async () => {
        if (!userX || !playerOUsernameInput) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/game/join?userIdX=${userX.id}&usernameO=${playerOUsernameInput}`,
                { method: "POST" }
            );
            
            if (!response.ok) throw new Error("Failed to register/join Player O");

            const userOData = await response.json();
            setUserO(userOData); // Set Player O user object
            setPlayerOUsernameInput('');
            
            updateAllStats(); // Fetch Player O's initial stats

        } catch (error) {
            console.error('Error joining game as Player O:', error);
            setError(`Failed to join as Player O: ${error.message}`);
        }
    };


    // Fetch stats whenever the users change (X or O)
    useEffect(() => {
        updateAllStats();
    }, [userX, userO, updateAllStats]);

    // --- Game Logic ---

    const fetchGameStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const userId = userX?.id || 0; 
            const url = `${API_BASE_URL}/api/game?userId=${userId}&mode=${mode}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch game state");
            const data = await response.json();
            setGame(data);
        } catch (e) {
            setError("Could not connect to the Java backend on port 8080.");
        } finally {
            setLoading(false);
        }
    }, [userX, mode]);

    useEffect(() => {
        fetchGameStatus();
    }, [fetchGameStatus, mode]); // Rerun if mode changes

    const handleMove = useCallback(
        async (index) => {
            if (game.board[index] || game.winner || loading) return;
            
            setLoading(true);
            
            // In two-player mode, we must ensure Player O is logged in before allowing moves
            if (mode === 'TWO_PLAYER' && !userO) {
                setLoading(false);
                setError("In Two Player mode, Player O must join the game first.");
                return;
            }

            // Optimistic update for immediate visual feedback (only for user's move)
            if (mode === 'TWO_PLAYER' || (mode === 'SINGLE_PLAYER' && game.currentPlayer === 'X')) {
                setGame((prev) => {
                    const newBoard = [...prev.board];
                    newBoard[index] = prev.currentPlayer;
                    return { ...prev, board: newBoard };
                });
            }
            
            try {
                const userId = userX?.id || 0; // Always use User X's ID to initiate the game session
                const url = `${API_BASE_URL}/api/move?index=${index}&userId=${userId}&mode=${mode}&difficulty=${difficulty}`;
                
                const response = await fetch(url, { method: "POST" });
                const data = await response.json();
                
                if (!response.ok) {
                    // Revert optimistic update and re-fetch if server move failed
                    fetchGameStatus(); 
                    throw new Error(data.message || "Move failed on server.");
                } else {
                    setGame(data);
                    if (data.winner) {
                        updateAllStats(); // Update stats for both players on game end
                    }
                }
            } catch (e) {
                setError("Error processing move. Try restarting.");
                fetchGameStatus(); // Fallback: get correct state from server
            } finally {
                setLoading(false);
            }
        },
        [game, userX, userO, mode, difficulty, loading, fetchGameStatus, updateAllStats]
    );

    const handleRestart = useCallback(async () => {
        setLoading(true);
        try {
            const userId = userX?.id || 0;
            const url = `${API_BASE_URL}/api/restart?userId=${userId}&mode=${mode}`;
            const response = await fetch(url, { method: "POST" });
            const data = await response.json();
            setGame(data);
            
            updateAllStats(); // Update X's stats

        } catch {
            setError("Could not restart the game. Check backend connection.");
        } finally {
            setLoading(false);
        }
    }, [userX, mode, updateAllStats]);
    
    // --- Helper Components & Display Logic ---

    const StatsCard = ({ user, stats, symbol, className = "" }) => (
        <div className={`p-4 rounded-xl shadow-lg border border-gray-200 ${className}`}>
            <h3 className={`text-lg font-bold mb-2 flex items-center ${symbol === 'X' ? 'text-blue-500' : 'text-pink-500'}`}>
                {symbol === 'X' ? <X size={18} className="mr-1" /> : <Circle size={18} className="mr-1" />}
                {user ? user.username : "Guest"}
            </h3>
            <ul className="text-sm space-y-1 text-gray-600">
                <li className="font-semibold text-base text-green-600">
                    Best Streak: {stats.bestStreak} wins
                </li>
                <li>Wins: {stats.totalWins}</li>
                <li>Losses: {stats.totalLosses}</li>
                <li>Draws: {stats.totalDraws}</li>
            </ul>
        </div>
    );

    const Square = ({ value, onClick, isWinning }) => {
        const isX = value === "X";
        const content = value ? (
            isX ? (
                <X className="w-3/4 h-3/4" />
            ) : (
                <Circle className="w-3/4 h-3/4" />
            )
        ) : null;

        return (
            <button
                className={`flex items-center justify-center h-24 w-24 md:h-32 md:w-32 rounded-xl border border-gray-300 
                    bg-white hover:bg-gray-100 shadow-md transition-all duration-200 text-5xl md:text-6xl font-bold
                    ${!value && !game.winner ? "cursor-pointer" : "cursor-default"}
                    ${isWinning ? "bg-green-100 border-green-400" : ""}
                    ${isX ? "text-blue-500" : "text-pink-500"}
                `}
                onClick={onClick}
                // Disable if game is over, cell is filled, or if it's AI's turn (Single Player)
                disabled={
                    !!value || 
                    !!game.winner || 
                    (mode === 'SINGLE_PLAYER' && game.currentPlayer === 'O') ||
                    // Disable if Player O hasn't joined yet in Two Player mode
                    (mode === 'TWO_PLAYER' && game.currentPlayer === 'O' && !userO)
                }
            >
                {content}
            </button>
        );
    };

    const status = useMemo(() => {
        if (loading) return "Processing...";
        if (game.winner === "Draw") return "It's a Draw!";
        
        let winnerName = "";
        let playerXName = userX ? userX.username : "Player X";
        let playerOName = userO ? userO.username : "Player O";

        if (game.winner) {
            if (game.winner === "X") {
                winnerName = mode === "SINGLE_PLAYER" ? "You" : playerXName;
            } else { // game.winner === "O"
                winnerName = mode === "SINGLE_PLAYER" ? "AI" : playerOName;
            }
            return `Winner: ${winnerName}!`;
        }

        if (mode === "SINGLE_PLAYER") {
            return game.currentPlayer === "X" ? "Your Turn (X)" : "AI's Turn (O)";
        }
        
        // Two Player Mode
        const currentPlayerName = game.currentPlayer === 'X' ? playerXName : playerOName;
        return `Current Player: ${currentPlayerName} (${game.currentPlayer})`;

    }, [game.winner, game.currentPlayer, loading, mode, userX, userO]);
    
    // --- Render ---

    return (
        <div className="w-screen min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-4 md:p-10">
            <h1 className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 drop-shadow-sm leading-tight mb-8 text-center">
                Tic-Tac-Toe
            </h1>
            <p className="text-lg md:text-xl font-medium text-gray-600 mb-8 -mt-6 text-center">
                By Anuradha Mahesh and Aziz Zoomkhawala
            </p>

            {/* Error Message */}
            {error && (
                <div className="p-3 w-full max-w-lg bg-red-100 text-red-700 rounded-lg text-sm text-center shadow-sm mb-4">
                    {error}
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-col md:flex-row w-full max-w-5xl justify-center items-start space-y-8 md:space-y-0 md:space-x-12">
                
                {/* Left Panel - Controls & Status */}
                <div className="w-full md:w-1/3 space-y-6 order-2 md:order-1">
                    
                    {/* User Panel (Player X) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-xl font-bold mb-3 text-gray-700 flex items-center">
                            <User className="mr-2" size={20} />
                            {userX ? `Welcome, ${userX.username}` : "Guest"}
                        </h2>
                        {userX ? (
                            <>
                                <p className="text-sm text-gray-600 mb-4">You are Player X (Host).</p>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-base rounded-full shadow-md transition-all w-full"
                                >
                                    <LogOut size={18} /> <span>Logout All</span>
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col space-y-2">
                                <input
                                    type="text"
                                    placeholder="Enter username (Player X)"
                                    value={loginInput}
                                    onChange={(e) => setLoginInput(e.target.value)}
                                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                />
                                <button
                                    onClick={handleLogin}
                                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base rounded-full shadow-md transition-all"
                                >
                                    <LogIn size={18} /> <span>Login / Register (Player X)</span>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Player O Join Input (Visible only in Two Player mode and if X is logged in) */}
                    {mode === 'TWO_PLAYER' && userX && !userO && (
                        <div className="bg-purple-50 p-6 rounded-xl shadow-lg border border-purple-200">
                            <h3 className="text-lg font-bold mb-2 text-purple-700 flex items-center">
                                <User className="mr-2" size={20} />
                                Player O Setup
                            </h3>
                            <div className="flex flex-col space-y-2">
                                <input
                                    type="text"
                                    placeholder="Enter username for Player O"
                                    value={playerOUsernameInput}
                                    onChange={(e) => setPlayerOUsernameInput(e.target.value)}
                                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                                />
                                <button
                                    onClick={joinGame}
                                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold text-base rounded-full shadow-md transition-all"
                                    disabled={!playerOUsernameInput}
                                >
                                    <span>Join as Player O</span>
                                </button>
                            </div>
                            <p className="text-xs text-purple-600 mt-2">Player O must join to track stats.</p>
                        </div>
                    )}


                    {/* Game Settings */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-700 flex items-center justify-between">
                            Game Setup
                            <button onClick={() => setShowSettings(prev => !prev)} className="p-1 text-gray-400 hover:text-gray-600">
                                <Settings size={20} />
                            </button>
                        </h2>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Game Mode</label>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => { setMode("TWO_PLAYER"); handleRestart(); }} 
                                    className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${mode === "TWO_PLAYER" ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                >
                                    Two Player
                                </button>
                                <button 
                                    onClick={() => { setMode("SINGLE_PLAYER"); handleRestart(); }} 
                                    className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${mode === "SINGLE_PLAYER" ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                >
                                    Vs AI <Cpu size={16} className="inline ml-1" />
                                </button>
                            </div>
                        </div>

                        {mode === "SINGLE_PLAYER" && showSettings && (
                            <div className="mb-4 pt-4 border-t border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">AI Difficulty</label>
                                <div className="flex space-x-2">
                                    {["EASY", "MEDIUM", "HARD"].map((d) => (
                                        <button 
                                            key={d}
                                            onClick={() => { setDifficulty(d); handleRestart(); }} 
                                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${difficulty === d ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                        >
                                            {d.charAt(0) + d.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Stats Panel (Displays X and O stats if applicable) */}
                    {userX && (
                        <div className="space-y-4">
                            <StatsCard user={userX} stats={statsX} symbol="X" className="bg-blue-50" />
                            {userO && (
                                <StatsCard user={userO} stats={statsO} symbol="O" className="bg-pink-50" />
                            )}
                        </div>
                    )}

                </div>

                {/* Right Panel - Game Board */}
                <div className="w-full md:w-2/3 flex flex-col justify-center items-center space-y-8 order-1 md:order-2">
                    <div
                        className={`px-8 py-4 text-center rounded-xl font-semibold text-2xl shadow-lg transition-all duration-200 w-full max-w-sm
                            ${game.winner
                                ? "bg-yellow-100 text-yellow-800 ring-4 ring-yellow-300"
                                : "bg-blue-50 text-blue-800"}
                        `}
                    >
                        {status}
                    </div>

                    <div className="grid grid-cols-3 gap-4 md:gap-6 bg-white p-6 md:p-10 rounded-3xl shadow-2xl border-4 border-gray-100">
                        {game.board.map((cell, index) => (
                            <Square
                                key={index}
                                value={cell}
                                onClick={() => handleMove(index)}
                                isWinning={game.winningLine.includes(index)}
                            />
                        ))}
                    </div>
                    
                    <button
                        onClick={handleRestart}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 
                            hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-xl rounded-full 
                            shadow-lg transition-transform transform hover:scale-105 w-fit disabled:opacity-50"
                    >
                        <RefreshCw size={24} />
                        <span>{loading ? "Processing..." : "Restart Game"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;