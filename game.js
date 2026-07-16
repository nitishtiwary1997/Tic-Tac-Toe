// Game State variables
let activeTheme = 1;
let nickname = "Player 1";
let avatar = "🦊";
let gameMode = "ai"; // "ai", "local", or "online"
let aiDifficulty = "hard"; // "easy" or "hard"
let currentTurn = "X"; // "X" or "O"
let isGameActive = false;
let boardState = ["", "", "", "", "", "", "", "", ""];
let stats = { wins: 0, losses: 0, draws: 0 };
let firstPlayer = "X";

// Online Multiplayer variables
let database = null;
let onlineRoomId = "";
let playerSymbol = "X"; // "X" (Host) or "O" (Joiner)
let isOnlineMatch = false;
let roomRef = null;

// Firebase configuration (from google-services.json)
const firebaseConfig = {
  apiKey: "AIzaSyA1RZCcdugaGp148ietgp7eZQJkt8XEOAM",
  authDomain: "tic-tac-toe-ff07b.firebaseapp.com",
  databaseURL: "https://tic-tac-toe-ff07b-default-rtdb.firebaseio.com",
  projectId: "tic-tac-toe-ff07b",
  storageBucket: "tic-tac-toe-ff07b.firebasestorage.app",
  messagingSenderId: "367045210661",
  appId: "1:367045210661:android:66b315e8610483591485cc"
};

// Theme configuration
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
  initFirebase();
  initThemeSwitcher();
  initAvatarSelector();
  initNicknameInput();
  initGameControls();
  initCoinToss();
  initGameBoard();
  resetGameEngine(true);
});

// Initialize Firebase
function initFirebase() {
  try {
    if (typeof firebase !== "undefined") {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
      console.log("Firebase Realtime Database initialized successfully!");
    } else {
      console.warn("Firebase SDK script not loaded.");
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// 1. Theme Switcher
function initThemeSwitcher() {
  const swatches = document.querySelectorAll(".theme-swatch");
  swatches.forEach((swatch, index) => {
    swatch.addEventListener("click", () => {
      applyTheme(index + 1);
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
}

// 2. Avatar Selector
function initAvatarSelector() {
  const avatarBubbles = document.querySelectorAll(".avatar-bubble");
  avatarBubbles.forEach((bubble) => {
    if (bubble.textContent === avatar) {
      bubble.classList.add("selected");
    }

    bubble.addEventListener("click", () => {
      avatarBubbles.forEach((b) => b.classList.remove("selected"));
      bubble.classList.add("selected");
      avatar = bubble.textContent;
      updateGameStatusMessage("Profile updated! Choose mode or flip coin.");
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

// 4. Game Controls
function initGameControls() {
  const modeButtons = document.querySelectorAll("[data-mode]");
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      gameMode = btn.getAttribute("data-mode");

      const onlineSetupPanel = document.getElementById("online-setup-panel");
      const difficultyContainer = document.getElementById("difficulty-container");
      const coinTossCard = document.querySelector(".coin-toss-wrapper");

      // Show/Hide UI elements
      if (onlineSetupPanel) {
        onlineSetupPanel.style.display = gameMode === "online" ? "flex" : "none";
      }
      if (difficultyContainer) {
        difficultyContainer.style.display = gameMode === "ai" ? "block" : "none";
      }
      if (coinTossCard) {
        coinTossCard.style.display = "flex";
      }

      disconnectFromOnlineRoom();
      resetGameEngine(true);

      if (gameMode === "online") {
        updateGameStatusMessage("Online Mode selected. Host a new room or join an existing one.");
      } else {
        updateGameStatusMessage(`Mode set: ${gameMode === "ai" ? "Player vs AI" : "Local Pass & Play"}. Toss to start!`);
      }
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
      if (gameMode === "online") {
        resetOnlineRoom();
      } else {
        resetGameEngine(false);
      }
    });
  }

  const resetStatsBtn = document.getElementById("btn-reset-stats");
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener("click", () => {
      if (gameMode === "online" && roomRef) {
        roomRef.update({ scoreX: 0, scoreO: 0, drawsCount: 0 });
      } else {
        stats = { wins: 0, losses: 0, draws: 0 };
        updateStatsUI();
        resetGameEngine(false);
      }
    });
  }

  // Host and Join Button Handlers
  const hostBtn = document.getElementById("btn-host-room");
  if (hostBtn) {
    hostBtn.addEventListener("click", hostOnlineRoom);
  }

  const joinBtn = document.getElementById("btn-join-room");
  if (joinBtn) {
    joinBtn.addEventListener("click", joinOnlineRoom);
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

    // Generate result: 0 = Heads (X goes first), 1 = Tails (O goes first)
    const result = Math.floor(Math.random() * 2);
    
    coin.className = "coin";
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
      
      if (gameMode === "online") {
        if (playerSymbol === "X" && roomRef) {
          // Sync online start turn to database
          roomRef.update({
            currentTurn: firstPlayer,
            status: "ACTIVE",
            board: Array(9).fill("EMPTY")
          });
        }
      } else {
        isGameActive = true;
        currentTurn = firstPlayer;
        boardState = Array(9).fill("");
        renderBoardUI();

        const strikeLine = document.getElementById("winning-strike-line");
        if (strikeLine) strikeLine.className = "mock-line";

        if (firstPlayer === "X") {
          updateGameStatusMessage(`${avatar} ${nickname} (X) won the toss! Play first move.`);
          enableCells(true);
        } else {
          if (gameMode === "ai") {
            updateGameStatusMessage(`AI (O) won the toss and plays first!`);
            enableCells(false);
            setTimeout(makeAIMove, 1000);
          } else {
            updateGameStatusMessage(`Player O won the toss and plays first!`);
            enableCells(true);
          }
        }
      }
    }, 2000);
  });
}

// 6. Game Board clicks
function initGameBoard() {
  const cells = document.querySelectorAll(".mock-cell");
  cells.forEach((cell, index) => {
    cell.addEventListener("click", () => {
      if (!isGameActive || boardState[index] !== "") return;
      
      if (gameMode === "online") {
        if (currentTurn !== playerSymbol) return; // Block clicking if it's opponent's turn
        makeOnlineMove(index);
      } else {
        if (gameMode === "ai" && currentTurn === "O") return;
        makeMove(index, currentTurn);
      }
    });
  });
}

// Make local move
function makeMove(index, player) {
  boardState[index] = player;
  renderBoardUI();

  if (navigator.vibrate) {
    navigator.vibrate(20);
  }

  const check = checkWinCondition(boardState);
  if (check.win) {
    handleGameOver("win", check.combination);
  } else if (check.draw) {
    handleGameOver("draw");
  } else {
    currentTurn = currentTurn === "X" ? "O" : "X";
    
    if (gameMode === "ai" && currentTurn === "O") {
      updateGameStatusMessage(`AI's turn...`);
      enableCells(false);
      setTimeout(makeAIMove, 800);
    } else {
      const activeName = currentTurn === "X" ? `${avatar} ${nickname}` : "Player O";
      updateGameStatusMessage(`${activeName}'s turn (${currentTurn})`);
      enableCells(true);
    }
  }
}

// AI Turn logic
function makeAIMove() {
  if (!isGameActive) return;

  let bestMove = (aiDifficulty === "easy") ? getRandomEmptyCell() : getBestMoveMiniMax();

  if (bestMove !== undefined && bestMove !== null) {
    makeMove(bestMove, "O");
  }
}

function getRandomEmptyCell() {
  let empties = [];
  boardState.forEach((val, idx) => {
    if (val === "") empties.push(idx);
  });
  if (empties.length === 0) return null;
  return empties[Math.floor(Math.random() * empties.length)];
}

function getBestMoveMiniMax() {
  // 1. Can AI Win?
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
  // 2. Block player X
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
  if (boardState[4] === "") return 4;
  const corners = [0, 2, 6, 8];
  let emptyCorners = corners.filter(idx => boardState[idx] === "");
  if (emptyCorners.length > 0) {
    return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
  }
  return getRandomEmptyCell();
}

// Check Win Conditions
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

  // Auto-reset board after 3 seconds
  if (gameMode === "online") {
    if (playerSymbol === "X" && roomRef) {
      setTimeout(() => {
        resetOnlineRoom();
      }, 3500);
    }
  } else {
    setTimeout(() => {
      resetGameEngine(false);
    }, 3000);
  }
}

// Render UI Elements
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
  boardState = Array(9).fill("");
  currentTurn = "X";
  
  renderBoardUI();
  enableCells(false);

  const coin = document.getElementById("game-coin");
  if (coin) coin.className = "coin";

  const strikeLine = document.getElementById("winning-strike-line");
  if (strikeLine) strikeLine.className = "mock-line";

  if (gameMode !== "online") {
    if (isFullReset) {
      updateGameStatusMessage("Choose settings, then click 'Flip Coin' to start!");
    } else {
      updateGameStatusMessage("Board reset! Click 'Flip Coin' to play again.");
    }
  }
}

/* ==========================================================================
   Online Room Logic (RTDB Sync)
   ========================================================================== */

function hostOnlineRoom() {
  if (!database) {
    updateOnlineStatus("Firebase not initialized! Verify configs.");
    return;
  }

  disconnectFromOnlineRoom();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  onlineRoomId = code;
  playerSymbol = "X";
  isOnlineMatch = true;

  updateOnlineStatus("Creating room...");

  const roomData = {
    roomId: code,
    playerXName: nickname,
    playerXAvatarId: avatar,
    playerOName: "",
    playerOAvatarId: "",
    board: Array(9).fill("EMPTY"),
    currentTurn: "X",
    status: "WAITING",
    winnerSymbol: "EMPTY",
    rematchX: false,
    rematchO: false,
    scoreX: 0,
    scoreO: 0,
    drawsCount: 0,
    roundNumber: 1
  };

  roomRef = database.ref("rooms/" + code);
  roomRef.set(roomData).then(() => {
    updateOnlineStatus(`Room Created! Code: ${code}`);
    roomRef.on("value", handleOnlineRoomUpdate);
    
    // Show coin toss for host to flip once someone joins
    const coinTossCard = document.querySelector(".coin-toss-wrapper");
    if (coinTossCard) {
      coinTossCard.style.display = "flex";
      const tossBtn = document.getElementById("btn-toss-coin");
      if (tossBtn) tossBtn.disabled = true; // Disabled until player joins
    }
  }).catch((e) => {
    updateOnlineStatus("Error creating room: " + e.message);
  });
}

function joinOnlineRoom() {
  if (!database) {
    updateOnlineStatus("Firebase not initialized!");
    return;
  }

  const codeInput = document.getElementById("room-code-input");
  const code = codeInput ? codeInput.value.trim() : "";

  if (code.length !== 6 || isNaN(code)) {
    updateOnlineStatus("Please enter a valid 6-digit code.");
    return;
  }

  disconnectFromOnlineRoom();
  updateOnlineStatus(`Connecting to room ${code}...`);

  const targetRoomRef = database.ref("rooms/" + code);
  targetRoomRef.once("value").then((snapshot) => {
    if (!snapshot.exists()) {
      updateOnlineStatus("Room code not found!");
      return;
    }

    const room = snapshot.val();
    if (room.status !== "WAITING") {
      updateOnlineStatus("Room is already active, full, or completed.");
      return;
    }

    onlineRoomId = code;
    playerSymbol = "O";
    isOnlineMatch = true;

    // Join room
    targetRoomRef.update({
      playerOName: nickname,
      playerOAvatarId: avatar,
      status: "ACTIVE"
    }).then(() => {
      roomRef = targetRoomRef;
      roomRef.on("value", handleOnlineRoomUpdate);
      updateOnlineStatus(`Joined Room: ${code}`);
    }).catch((e) => {
      updateOnlineStatus("Error joining: " + e.message);
    });
  }).catch((e) => {
    updateOnlineStatus("Database fetch error: " + e.message);
  });
}

function handleOnlineRoomUpdate(snapshot) {
  const room = snapshot.val();
  if (!room) {
    updateGameStatusMessage("The host closed this online room.");
    disconnectFromOnlineRoom();
    resetGameEngine(true);
    return;
  }

  // Update scores in real-time
  stats.wins = room.scoreX || 0;
  stats.losses = room.scoreO || 0;
  stats.draws = room.drawsCount || 0;
  updateStatsUI();

  // Sync board representation
  if (room.board) {
    boardState = room.board.map(val => val === "EMPTY" ? "" : val);
    renderBoardUI();
  }

  currentTurn = room.currentTurn || "X";

  // Hide or configure coin toss panel
  const coinTossCard = document.querySelector(".coin-toss-wrapper");
  const tossBtn = document.getElementById("btn-toss-coin");

  if (room.status === "WAITING") {
    updateOnlineStatus(`Hosting Room: ${room.roomId}`);
    updateGameStatusMessage("Waiting for an opponent to join...");
    isGameActive = false;
    enableCells(false);
    
    if (tossBtn) tossBtn.disabled = true;
  } 
  else if (room.status === "ACTIVE") {
    updateOnlineStatus(`Room: ${room.roomId} | Connected`);
    
    // Check if game is playable (if currentTurn and board elements are set)
    isGameActive = true;

    // If turn is set in Firebase, let the turn-owner play
    if (currentTurn === playerSymbol) {
      updateGameStatusMessage(`It's your turn (${playerSymbol})! Make a move.`);
      enableCells(true);
    } else {
      const oppName = playerSymbol === "X" 
        ? `${room.playerOAvatarId || "🤖"} ${room.playerOName || "Player O"}` 
        : `${room.playerXAvatarId || "🦊"} ${room.playerXName || "Player X"}`;
      updateGameStatusMessage(`Waiting for opponent ${oppName} (${currentTurn})...`);
      enableCells(false);
    }

    // Configure Coin Toss display based on hosting role
    if (coinTossCard) {
      if (playerSymbol === "X") {
        // Host gets to toss if they haven't yet (board is completely empty)
        const isBoardEmpty = boardState.every(c => c === "");
        if (isBoardEmpty) {
          coinTossCard.style.display = "flex";
          if (tossBtn) {
            tossBtn.disabled = false;
            tossBtn.textContent = "Flip Coin for First Move";
          }
        } else {
          coinTossCard.style.display = "none";
        }
      } else {
        // Guest waits for Host to toss
        const isBoardEmpty = boardState.every(c => c === "");
        if (isBoardEmpty) {
          coinTossCard.style.display = "flex";
          if (tossBtn) {
            tossBtn.disabled = true;
            tossBtn.textContent = "Waiting for host to flip coin...";
          }
        } else {
          coinTossCard.style.display = "none";
        }
      }
    }
  } 
  else if (room.status === "WON") {
    isGameActive = false;
    enableCells(false);

    // Render winning line locally
    const check = checkWinCondition(boardState);
    if (check.win) {
      const strikeLine = document.getElementById("winning-strike-line");
      if (strikeLine) {
        strikeLine.className = `mock-line active ${check.combination.class}`;
      }
    }

    const winner = room.winnerSymbol;
    if (winner === playerSymbol) {
      updateGameStatusMessage(`🎉 YOU WON THE MATCH!`);
    } else {
      updateGameStatusMessage(`💀 Opponent won!`);
    }

    if (playerSymbol === "X") {
      setTimeout(resetOnlineRoom, 4000); // Host triggers auto-reset
    }
  } 
  else if (room.status === "DRAW") {
    isGameActive = false;
    enableCells(false);
    updateGameStatusMessage(`🤝 It's a draw!`);
    
    if (playerSymbol === "X") {
      setTimeout(resetOnlineRoom, 4000); // Host triggers auto-reset
    }
  }
}

function makeOnlineMove(index) {
  if (!isGameActive || boardState[index] !== "" || currentTurn !== playerSymbol || !roomRef) return;

  boardState[index] = playerSymbol;
  renderBoardUI();

  const dbBoard = boardState.map(val => val === "" ? "EMPTY" : val);
  const nextTurn = playerSymbol === "X" ? "O" : "X";

  const check = checkWinCondition(boardState);
  let statusUpdate = "ACTIVE";
  let winnerSymbolUpdate = "EMPTY";
  let scoreXUpdate = stats.wins;
  let scoreOUpdate = stats.losses;
  let drawsUpdate = stats.draws;

  if (check.win) {
    statusUpdate = "WON";
    winnerSymbolUpdate = playerSymbol;
    if (playerSymbol === "X") scoreXUpdate++;
    else scoreOUpdate++;
  } else if (check.draw) {
    statusUpdate = "DRAW";
    winnerSymbolUpdate = "DRAW";
    drawsUpdate++;
  }

  // Sync to database
  roomRef.update({
    board: dbBoard,
    currentTurn: nextTurn,
    status: statusUpdate,
    winnerSymbol: winnerSymbolUpdate,
    scoreX: scoreXUpdate,
    scoreO: scoreOUpdate,
    drawsCount: drawsUpdate
  });
}

function resetOnlineRoom() {
  if (roomRef && playerSymbol === "X") {
    // Host swaps the starting player for the next round
    const nextStartTurn = firstPlayer === "X" ? "O" : "X";
    firstPlayer = nextStartTurn;

    roomRef.update({
      board: Array(9).fill("EMPTY"),
      currentTurn: nextStartTurn,
      status: "ACTIVE",
      winnerSymbol: "EMPTY",
      rematchX: false,
      rematchO: false
    });
  }
}

function disconnectFromOnlineRoom() {
  if (roomRef) {
    roomRef.off();
    roomRef = null;
  }
  onlineRoomId = "";
  isOnlineMatch = false;
  updateOnlineStatus("");
}
