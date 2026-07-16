// Game State
let activeTheme = 1;
let nickname = "Player 1";
let avatar = "🦊";
let gameMode = "ai"; // "ai" or "local"
let aiDifficulty = "hard"; // "easy" or "hard"
let currentTurn = "X"; // "X" or "O"
let isGameActive = false;
let boardState = ["", "", "", "", "", "", "", "", ""];
let stats = { wins: 0, losses: 0, draws: 0 };
let firstPlayer = "X"; // Who starts the game

// Theme Color Palettes
const themes = {
  1: {
    primary: "#00f0ff",
    secondary: "#d946ef",
    accent: "#8b5cf6",
    glowPrimary: "0 0 15px rgba(0, 240, 255, 0.4)",
    glowSecondary: "0 0 15px rgba(217, 70, 239, 0.4)",
    glowAccent: "0 0 20px rgba(139, 92, 246, 0.3)"
  },
  2: {
    primary: "#ff00a0",
    secondary: "#7928ca",
    accent: "#a855f7",
    glowPrimary: "0 0 15px rgba(255, 0, 160, 0.4)",
    glowSecondary: "0 0 15px rgba(121, 40, 202, 0.4)",
    glowAccent: "0 0 20px rgba(168, 85, 247, 0.3)"
  },
  3: {
    primary: "#10b981",
    secondary: "#059669",
    accent: "#34d399",
    glowPrimary: "0 0 15px rgba(16, 185, 129, 0.4)",
    glowSecondary: "0 0 15px rgba(5, 150, 105, 0.4)",
    glowAccent: "0 0 20px rgba(52, 211, 153, 0.3)"
  },
  4: {
    primary: "#f59e0b",
    secondary: "#d97706",
    accent: "#fbbf24",
    glowPrimary: "0 0 15px rgba(245, 158, 11, 0.4)",
    glowSecondary: "0 0 15px rgba(217, 119, 6, 0.4)",
    glowAccent: "0 0 20px rgba(251, 191, 36, 0.3)"
  },
  5: {
    primary: "#ef4444",
    secondary: "#b91c1c",
    accent: "#f87171",
    glowPrimary: "0 0 15px rgba(239, 68, 68, 0.4)",
    glowSecondary: "0 0 15px rgba(185, 28, 28, 0.4)",
    glowAccent: "0 0 20px rgba(248, 113, 113, 0.3)"
  }
};

// Winning lines mapping to CSS classes
const WINNING_COMBINATIONS = [
  { combo: [0, 1, 2], class: "horiz-1" },
  { combo: [3, 4, 5], class: "horiz-2" },
  { combo: [6, 7, 8], class: "horiz-3" },
  { combo: [0, 3, 6], class: "vert-1" },
  { combo: [1, 4, 7], class: "vert-2" },
  { combo: [2, 5, 8], class: "vert-3" },
  { combo: [0, 4, 8], class: "diag-1" },
  { combo: [2, 4, 6], class: "diag-2" }
];

document.addEventListener("DOMContentLoaded", () => {
  initThemeSwitcher();
  initAvatarSelector();
  initNicknameInput();
  initGameControls();
  initCoinToss();
  initGameBoard();
  resetGameEngine(true);
});

// 1. Theme Switcher
function initThemeSwitcher() {
  const swatches = document.querySelectorAll(".theme-swatch");
  swatches.forEach((swatch, index) => {
    swatch.addEventListener("click", () => {
      const themeId = index + 1;
      applyTheme(themeId);
    });
  });
}

function applyTheme(themeId) {
  activeTheme = themeId;
  const theme = themes[themeId];
  if (!theme) return;

  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.primary);
  root.style.setProperty("--color-secondary", theme.secondary);
  root.style.setProperty("--color-accent", theme.accent);
  root.style.setProperty("--glow-shadow-primary", theme.glowPrimary);
  root.style.setProperty("--glow-shadow-secondary", theme.glowSecondary);
  root.style.setProperty("--glow-shadow-accent", theme.glowAccent);

  // Custom logging/feedback if needed
  console.log(`Theme ${themeId} applied`);
}

// 2. Avatar Selector
function initAvatarSelector() {
  const avatarBubbles = document.querySelectorAll(".avatar-bubble");
  avatarBubbles.forEach((bubble) => {
    // Select default 🦊
    if (bubble.textContent === avatar) {
      bubble.classList.add("selected");
    }

    bubble.addEventListener("click", () => {
      avatarBubbles.forEach((b) => b.classList.remove("selected"));
      bubble.classList.add("selected");
      avatar = bubble.textContent;
      updateGameStatusMessage("Profile updated! Click 'Flip Coin' to play.");
    });
  });
}

// 3. Nickname Input
function initNicknameInput() {
  const input = document.getElementById("player-nickname");
  if (input) {
    input.addEventListener("input", (e) => {
      nickname = e.target.value.trim() || "Player 1";
    });
  }
}

// 4. Game Controls (Modes and Difficulty)
function initGameControls() {
  const modeButtons = document.querySelectorAll("[data-mode]");
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      gameMode = btn.getAttribute("data-mode");

      // Show/Hide AI levels based on mode
      const difficultyContainer = document.getElementById("difficulty-container");
      if (difficultyContainer) {
        difficultyContainer.style.display = gameMode === "ai" ? "flex" : "none";
      }

      resetGameEngine(true);
      updateGameStatusMessage(`Mode set: ${gameMode === "ai" ? "Player vs AI" : "Local Pass & Play"}. Toss to start!`);
    });
  });

  const diffButtons = document.querySelectorAll("[data-diff]");
  diffButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      diffButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      aiDifficulty = btn.getAttribute("data-diff");
      resetGameEngine(true);
      updateGameStatusMessage(`AI Difficulty set to ${aiDifficulty.toUpperCase()}. Toss to start!`);
    });
  });

  // Action buttons
  const resetBtn = document.getElementById("btn-reset-game");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetGameEngine(false); // Reset board only
    });
  }

  const resetStatsBtn = document.getElementById("btn-reset-stats");
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener("click", () => {
      stats = { wins: 0, losses: 0, draws: 0 };
      updateStatsUI();
      resetGameEngine(false);
    });
  }
}

// 5. Coin Toss
function initCoinToss() {
  const coin = document.getElementById("game-coin");
  const tossBtn = document.getElementById("btn-toss-coin");

  if (!tossBtn || !coin) return;

  tossBtn.addEventListener("click", () => {
    tossBtn.disabled = true;
    updateGameStatusMessage("Flipping coin...");

    // Generate random result: 0 = Heads (Player X), 1 = Tails (AI / Player O)
    const result = Math.floor(Math.random() * 2);
    
    // Set 3D spin class
    coin.className = "coin"; // Reset rotation classes
    void coin.offsetWidth; // Trigger reflow
    
    if (result === 0) {
      coin.classList.add("flip-heads");
      firstPlayer = "X";
    } else {
      coin.classList.add("flip-tails");
      firstPlayer = "O";
    }

    setTimeout(() => {
      tossBtn.disabled = false;
      isGameActive = true;
      currentTurn = firstPlayer;
      boardState = ["", "", "", "", "", "", "", "", ""];
      renderBoardUI();

      const strikeLine = document.getElementById("winning-strike-line");
      if (strikeLine) strikeLine.className = "mock-line"; // Reset winning line

      if (firstPlayer === "X") {
        updateGameStatusMessage(`${avatar} ${nickname} (X) won the toss and plays first!`);
        enableCells(true);
      } else {
        if (gameMode === "ai") {
          updateGameStatusMessage(`Robot (O) won the toss and plays first!`);
          enableCells(false);
          // AI makes first move
          setTimeout(makeAIMove, 1000);
        } else {
          updateGameStatusMessage(`Player O won the toss and plays first!`);
          enableCells(true);
        }
      }
    }, 2000);
  });
}

// 6. Game Board
function initGameBoard() {
  const cells = document.querySelectorAll(".mock-cell");
  cells.forEach((cell, index) => {
    cell.addEventListener("click", () => {
      if (!isGameActive || boardState[index] !== "") return;
      if (gameMode === "ai" && currentTurn === "O") return; // Block click during AI turn

      makeMove(index, currentTurn);
    });
  });
}

// Make a move
function makeMove(index, player) {
  boardState[index] = player;
  renderBoardUI();

  // Play a tiny vibration on mobile devices if supported
  if (navigator.vibrate) {
    navigator.vibrate(20);
  }

  const check = checkWinCondition(boardState);
  if (check.win) {
    handleGameOver("win", check.combination);
  } else if (check.draw) {
    handleGameOver("draw");
  } else {
    // Switch turn
    currentTurn = currentTurn === "X" ? "O" : "X";
    
    if (gameMode === "ai" && currentTurn === "O") {
      updateGameStatusMessage(`Robot's turn...`);
      enableCells(false);
      setTimeout(makeAIMove, 800);
    } else {
      const activeName = currentTurn === "X" ? `${avatar} ${nickname}` : "Player O";
      updateGameStatusMessage(`${activeName}'s turn (${currentTurn})`);
      enableCells(true);
    }
  }
}

// AI Turn Engine
function makeAIMove() {
  if (!isGameActive) return;

  let bestMove;
  if (aiDifficulty === "easy") {
    bestMove = getRandomEmptyCell();
  } else {
    bestMove = getBestMoveMiniMax();
  }

  if (bestMove !== undefined && bestMove !== null) {
    makeMove(bestMove, "O");
  }
}

// Random AI
function getRandomEmptyCell() {
  let empties = [];
  boardState.forEach((val, idx) => {
    if (val === "") empties.push(idx);
  });
  if (empties.length === 0) return null;
  return empties[Math.floor(Math.random() * empties.length)];
}

// Smart AI (MiniMax)
function getBestMoveMiniMax() {
  // 1. Can AI Win in this move?
  for (let i = 0; i < 9; i++) {
    if (boardState[i] === "") {
      boardState[i] = "O";
      if (checkWinCondition(boardState).win) {
        boardState[i] = "";
        return i;
      }
      boardState[i] = "";
    }
  }

  // 2. Can Player Win in next move? (Block them!)
  for (let i = 0; i < 9; i++) {
    if (boardState[i] === "") {
      boardState[i] = "X";
      if (checkWinCondition(boardState).win) {
        boardState[i] = "";
        return i;
      }
      boardState[i] = "";
    }
  }

  // 3. Take center if available
  if (boardState[4] === "") return 4;

  // 4. Take opposite corner if player has corner
  const corners = [0, 2, 6, 8];
  let emptyCorners = corners.filter(idx => boardState[idx] === "");
  if (emptyCorners.length > 0) {
    // Pick first available corner
    return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
  }

  // 5. Take random remaining
  return getRandomEmptyCell();
}

// Check Win
function checkWinCondition(tempBoard) {
  for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
    const { combo, class: cssClass } = WINNING_COMBINATIONS[i];
    if (tempBoard[combo[0]] !== "" &&
        tempBoard[combo[0]] === tempBoard[combo[1]] &&
        tempBoard[combo[0]] === tempBoard[combo[2]]) {
      return { win: true, combination: WINNING_COMBINATIONS[i], player: tempBoard[combo[0]] };
    }
  }
  
  const isDraw = tempBoard.every(cell => cell !== "");
  return { win: false, draw: isDraw };
}

// Handle Game Over
function handleGameOver(result, winningCombination = null) {
  isGameActive = false;
  enableCells(false);

  if (result === "win") {
    const winner = boardState[winningCombination.combo[0]];
    
    // Draw winning strike line
    const strikeLine = document.getElementById("winning-strike-line");
    if (strikeLine) {
      strikeLine.className = `mock-line active ${winningCombination.class}`;
    }

    if (winner === "X") {
      updateGameStatusMessage(`🎉 ${avatar} ${nickname} wins!`);
      stats.wins++;
    } else {
      if (gameMode === "ai") {
        updateGameStatusMessage(`🤖 AI wins! Better luck next time.`);
        stats.losses++;
      } else {
        updateGameStatusMessage(`🎉 Player O wins!`);
        stats.losses++;
      }
    }
  } else {
    updateGameStatusMessage(`🤝 It's a draw! Well played.`);
    stats.draws++;
  }

  updateStatsUI();

  // Auto-reset the board after 3 seconds so the user can see the winning line / results first
  setTimeout(() => {
    resetGameEngine(false);
  }, 3000);
}

// Helpers & UI Renderers
function renderBoardUI() {
  const cells = document.querySelectorAll(".mock-cell");
  cells.forEach((cell, index) => {
    const value = boardState[index];
    cell.textContent = value;
    cell.className = "mock-cell playable";
    
    if (value === "X") {
      cell.classList.add("x");
      cell.classList.remove("playable");
    } else if (value === "O") {
      cell.classList.add("o");
      cell.classList.remove("playable");
    }
  });
}

function enableCells(enable) {
  const cells = document.querySelectorAll(".mock-cell");
  cells.forEach(c => {
    if (enable) {
      if (!c.classList.contains("x") && !c.classList.contains("o")) {
        c.classList.add("playable");
      }
    } else {
      c.classList.remove("playable");
    }
  });
}

function updateGameStatusMessage(msg) {
  const statusLabel = document.getElementById("game-status-label");
  if (statusLabel) {
    statusLabel.textContent = msg;
    statusLabel.className = "game-status-text";
    if (currentTurn === "O" && isGameActive) {
      statusLabel.classList.add("turn-o");
    }
  }
}

function updateStatsUI() {
  const valWins = document.getElementById("stat-wins");
  const valLosses = document.getElementById("stat-losses");
  const valDraws = document.getElementById("stat-draws");

  if (valWins) valWins.textContent = stats.wins;
  if (valLosses) valLosses.textContent = stats.losses;
  if (valDraws) valDraws.textContent = stats.draws;
}

function resetGameEngine(isFullReset) {
  isGameActive = false;
  boardState = ["", "", "", "", "", "", "", "", ""];
  currentTurn = "X";
  
  // Render clean UI
  renderBoardUI();
  enableCells(false);

  // Reset coin tossing visual
  const coin = document.getElementById("game-coin");
  if (coin) coin.className = "coin";

  // Reset strike lines
  const strikeLine = document.getElementById("winning-strike-line");
  if (strikeLine) strikeLine.className = "mock-line";

  if (isFullReset) {
    updateGameStatusMessage("Choose your mode/profile, then click 'Flip Coin' to start!");
  } else {
    updateGameStatusMessage("Board reset! Click 'Flip Coin' to start again.");
  }
}
