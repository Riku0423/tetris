"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from 'framer-motion'

const TETROMINOS = [
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],  // I
  [[1, 1], [1, 1]],  // O
  [[0, 1, 0], [1, 1, 1], [0, 0, 0]],  // T
  [[1, 0, 0], [1, 1, 1], [0, 0, 0]],  // L
  [[0, 0, 1], [1, 1, 1], [0, 0, 0]],  // J
  [[0, 1, 1], [1, 1, 0], [0, 0, 0]],  // S
  [[1, 1, 0], [0, 1, 1], [0, 0, 0]]   // Z
]

const COLORS = [
  'bg-cyan-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-red-500'
]

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20

type Piece = {
  shape: number[][];
  color: string;
}

export function ComponentsStylishTetrisGame() {
  const [board, setBoard] = useState<(string | 0)[][]>(createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null)
  const [nextPiece, setNextPiece] = useState<Piece | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  function createEmptyBoard(): (string | 0)[][] {
    return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0))
  }

  const generateNewPiece = useCallback((): Piece => {
    const pieceIndex = Math.floor(Math.random() * TETROMINOS.length)
    return { shape: TETROMINOS[pieceIndex], color: COLORS[pieceIndex] }
  }, [])

  const startGame = useCallback(() => {
    setBoard(createEmptyBoard())
    setCurrentPiece(generateNewPiece())
    setNextPiece(generateNewPiece())
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 })
    setScore(0)
    setGameOver(false)
    setGameStarted(true)
  }, [generateNewPiece])

  const movePiece = useCallback((dx: number, dy: number) => {
    if (currentPiece && isValidMove(currentPiece.shape, position.x + dx, position.y + dy)) {
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }))
    }
  }, [currentPiece, position])

  const rotatePiece = useCallback(() => {
    if (!currentPiece) return
    const rotated = currentPiece.shape[0].map((_, index) =>
      currentPiece.shape.map(row => row[index]).reverse()
    )
    if (isValidMove(rotated, position.x, position.y)) {
      setCurrentPiece(prev => prev ? { ...prev, shape: rotated } : null)
    }
  }, [currentPiece, position])

  const isValidMove = useCallback((piece: number[][], x: number, y: number): boolean => {
    return piece.every((row, dy) =>
      row.every((value, dx) =>
        value === 0 || (
          x + dx >= 0 &&
          x + dx < BOARD_WIDTH &&
          y + dy < BOARD_HEIGHT &&
          (board[y + dy] === undefined || board[y + dy][x + dx] === 0)
        )
      )
    )
  }, [board])

  const lockPiece = useCallback(() => {
    if (!currentPiece) return
    const newBoard = board.map(row => [...row])
    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          newBoard[y + position.y][x + position.x] = currentPiece.color
        }
      })
    })
    setBoard(newBoard)
    clearLines(newBoard)
    setCurrentPiece(nextPiece)
    setNextPiece(generateNewPiece())
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 })

    if (nextPiece && !isValidMove(nextPiece.shape, Math.floor(BOARD_WIDTH / 2) - 2, 0)) {
      setGameOver(true)
    }
  }, [board, currentPiece, nextPiece, position, generateNewPiece, isValidMove])

  const clearLines = useCallback((board: (string | 0)[][]) => {
    let linesCleared = 0
    const newBoard = board.filter(row => {
      if (row.every(cell => cell !== 0)) {
        linesCleared++
        return false
      }
      return true
    })

    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0))
    }

    setBoard(newBoard)
    setScore(prev => prev + linesCleared * 100)
  }, [])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return
      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0)
          break
        case 'ArrowRight':
          movePiece(1, 0)
          break
        case 'ArrowDown':
          movePiece(0, 1)
          break
        case 'ArrowUp':
          rotatePiece()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [gameStarted, gameOver, movePiece, rotatePiece])

  useEffect(() => {
    if (!gameStarted || gameOver) return

    const gameLoop = setInterval(() => {
      if (currentPiece && isValidMove(currentPiece.shape, position.x, position.y + 1)) {
        setPosition(prev => ({ ...prev, y: prev.y + 1 }))
      } else {
        lockPiece()
      }
    }, 1000)

    return () => clearInterval(gameLoop)
  }, [gameStarted, gameOver, currentPiece, position, isValidMove, lockPiece])

  const renderCell = useCallback((value: string | 0, x: number, y: number) => {
    const isCurrent = currentPiece && y >= position.y && y < position.y + currentPiece.shape.length &&
                      x >= position.x && x < position.x + currentPiece.shape[0].length &&
                      currentPiece.shape[y - position.y][x - position.x] !== 0
    const cellClass = isCurrent ? currentPiece.color : value || 'bg-gray-900'
    return (
      <motion.div
        key={x}
        className={`w-6 h-6 border border-gray-800 ${cellClass}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
    )
  }, [currentPiece, position])

  const renderNextPiece = useCallback(() => {
    if (!nextPiece) return null
    const shape = nextPiece.shape
    const maxWidth = Math.max(...shape.map(row => row.length))
    const width = maxWidth

    return (
      <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}>
        {shape.map((row, y) => (
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`w-5 h-5 border border-gray-800 ${cell ? nextPiece.color : 'bg-gray-900'}`}
            />
          ))
        ))}
      </div>
    )
  }, [nextPiece])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white font-sans">
      <h1 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        Stylish Tetris
      </h1>
      <div className="flex gap-8">
        <div className="bg-gray-800 p-1 rounded-lg shadow-lg">
          {board.map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => renderCell(cell, x, y))}
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-between">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Next Piece</h2>
            <div className="flex justify-center items-center h-24 w-24 bg-gray-900 rounded-lg">
              {renderNextPiece()}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-2">Score</h2>
            <p className="text-4xl font-bold text-yellow-400">{score}</p>
            <AnimatePresence>
              {gameOver && (
                <motion.p
                  className="text-red-500 font-bold mt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  Game Over
                </motion.p>
              )}
            </AnimatePresence>
            <Button
              onClick={startGame}
              className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-full transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              {gameStarted ? 'Restart' : 'Start'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}