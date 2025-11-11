import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Circle, X } from "lucide-react";

const API_BASE_URL = "http://localhost:8080";

const App = () => {
  const [game, setGame] = useState({
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
    winningLine: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGameStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/game`);
      if (!response.ok) throw new Error("Failed to fetch game state");
      const data = await response.json();
      setGame(data);
    } catch (e) {
      setError("Could not connect to the Java backend on port 8080.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGameStatus();
  }, [fetchGameStatus]);

  const handleMove = useCallback(
    async (index) => {
      if (game.board[index] || game.winner) return;
      setGame((prev) => {
        const newBoard = [...prev.board];
        newBoard[index] = prev.currentPlayer;
        return { ...prev, board: newBoard };
      });

      try {
        const response = await fetch(`${API_BASE_URL}/move?index=${index}`, {
          method: "POST",
        });
        const data = await response.json();
        if (!response.ok) fetchGameStatus();
        else setGame(data);
      } catch {
        fetchGameStatus();
      }
    },
    [game, fetchGameStatus]
  );

  const handleRestart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/restart`, {
        method: "POST",
      });
      const data = await response.json();
      setGame(data);
    } catch {
      setError("Could not restart the game. Check backend connection.");
    } finally {
      setLoading(false);
    }
  }, []);

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
        className={`flex items-center justify-center h-32 w-32 rounded-xl border border-gray-300 
          bg-white hover:bg-gray-100 shadow-md transition-all duration-200 text-6xl font-bold
          ${!value && !game.winner ? "cursor-pointer" : "cursor-default"}
          ${isWinning ? "bg-green-100 border-green-400" : ""}
          ${isX ? "text-blue-500" : "text-pink-500"}
        `}
        onClick={onClick}
        disabled={!!value || !!game.winner}
      >
        {content}
      </button>
    );
  };

  const status =
    game.winner === "Draw"
      ? "It's a Draw!"
      : game.winner
      ? `Winner: ${game.winner}!`
      : `Current Player: ${game.currentPlayer}`;

  if (loading && !error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-600 text-xl">
        Loading game state...
      </div>
    );

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col md:flex-row items-center justify-between px-16 py-10">
      {/* Left Section */}
      <div className="flex flex-col justify-center w-full md:w-1/2 space-y-10 md:pr-12 -translate-y-10">
        <h1 className="text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 drop-shadow-sm leading-tight">
          Tic-Tac-Toe
        </h1>

        {error && (
          <div className="p-3 w-3/4 bg-red-100 text-red-700 rounded-lg text-sm text-center shadow-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleRestart}
          className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 
    hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-xl rounded-full 
    shadow-md transition-transform transform hover:scale-105 w-fit"
        >
          <RefreshCw size={24} />
          <span>Restart Game</span>
        </button>
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center space-y-10">
        <div
          className={`px-8 py-4 text-center rounded-lg font-semibold text-2xl shadow-sm transition-all duration-200
            ${
              game.winner
                ? "bg-yellow-100 text-yellow-800"
                : "bg-blue-50 text-blue-800"
            }`}
        >
          {status}
        </div>

        <div className="grid grid-cols-3 gap-6 bg-white p-10 rounded-3xl shadow-xl">
          {game.board.map((cell, index) => (
            <Square
              key={index}
              value={cell}
              onClick={() => handleMove(index)}
              isWinning={game.winningLine.includes(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
