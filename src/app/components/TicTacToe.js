import React, { useState } from "react";

const initialBoard = Array(9).fill(null);

function calculateWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export default function TicTacToe({ playerX = "You", playerO = "Friend", onClose }) {
  const [board, setBoard] = useState(initialBoard);
  const [xIsNext, setXIsNext] = useState(true);
  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(cell => cell);

  function handleClick(i) {
    if (board[i] || winner) return;
    if ((xIsNext && playerX !== "You") || (!xIsNext && playerO !== "You")) return; // Only allow current player
    const newBoard = board.slice();
    newBoard[i] = xIsNext ? "X" : "O";
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  }

  function resetGame() {
    setBoard(initialBoard);
    setXIsNext(true);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
          onClick={onClose}
          title="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Tic Tac Toe</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {board.map((cell, i) => (
            <button
              key={i}
              className="w-20 h-20 text-3xl font-bold border border-gray-300 rounded-lg bg-gray-50 hover:bg-blue-100 transition"
              onClick={() => handleClick(i)}
              disabled={!!cell || winner || (xIsNext ? playerX !== "You" : playerO !== "You")}
            >
              {cell}
            </button>
          ))}
        </div>
        <div className="text-center mb-4">
          {winner ? (
            <span className="text-green-600 font-semibold">{winner === "X" ? playerX : playerO} wins!</span>
          ) : isDraw ? (
            <span className="text-gray-600 font-semibold">It&apos;s a draw!</span>
          ) : (
              <span className="text-blue-700 font-semibold">{xIsNext ? playerX : playerO}&apos;s turn ({xIsNext ? "X" : "O"})</span>
          )}
        </div>
        <div className="flex justify-center gap-4">
          <button
            className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600"
            onClick={resetGame}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
