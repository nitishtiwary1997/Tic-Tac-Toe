// Game State variables
let activeTheme = 1;
let nickname = "Player 1";
let nicknameO = "Player 2";
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
let currentRound = 1;
let rematchRequested = false;

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

  const inputO = document.getElementById("player-o-nickname");
  if (inputO) {
    inputO.addEventListener("input", (e) => {
      nicknameO = e.target.value.trim() || "Player 2";
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

      // Configure layout visibility
      if (onlineSetupPanel) {
        onlineSetupPanel.style.display = gameMode === "online" ? "flex" : "none";
      }
      if (difficultyContainer) {
        difficultyContainer.style.display = gameMode === "ai" ? "block" : "none";
      }

      const playerOWrapper = document.getElementById("player-o-input-wrapper");
      const labelX = document.getElementById("label-player-x");

      if (gameMode === "local") {
        if (playerOWrapper) playerOWrapper.style.display = "block";
        if (labelX) labelX.textContent = "Player X Nickname:";
      } else {
        if (playerOWrapper) playerOWrapper.style.display = "none";
        if (labelX) labelX.textContent = gameMode === "online" ? "Your Nickname:" : "Set Nickname:";
      }

      if (gameMode === "online") {
        if (coinTossCard) coinTossCard.style.display = "none"; // Hide coin flip completely for online room
      } else {
        if (coinTossCard) coinTossCard.style.display = "flex";
      }

      disconnectFromOnlineRoom();
      resetGameEngine(true);
      configureActionButtonsUI();

      if (gameMode === "online") {
        updateGameStatusMessage("Online Mode. Host a new room or join an existing one.");
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

  // Action Buttons
  const resetBtn = document.getElementById("btn-reset-game");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetGameEngine(false);
    });
  }

  const rematchBtn = document.getElementById("btn-rematch-online");
  if (rematchBtn) {
    rematchBtn.addEventListener("click", requestOnlineRematch);
  }

  const leaveBtn = document.getElementById("btn-leave-room");
  if (leaveBtn) {
    leaveBtn.addEventListener("click", () => {
      leaveOnlineRoom();
      gameMode = "ai";
      
      // Update UI active states back to AI mode
      modeButtons.forEach((b) => b.classList.remove("active"));
      const aiBtn = document.querySelector('[data-mode="ai"]');
      if (aiBtn) aiBtn.classList.add("active");

      const onlineSetupPanel = document.getElementById("online-setup-panel");
      const difficultyContainer = document.getElementById("difficulty-container");
      const coinTossCard = document.querySelector(".coin-toss-wrapper");
      
      if (onlineSetupPanel) onlineSetupPanel.style.display = "none";
      if (difficultyContainer) difficultyContainer.style.display = "block";
      if (coinTossCard) coinTossCard.style.display = "flex";

      resetGameEngine(true);
      configureActionButtonsUI();
      updateGameStatusMessage("Left lobby. Mode set back to Player vs AI.");
    });
  }

  const resetStatsBtn = document.getElementById("btn-reset-stats");
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener("click", () => {
      stats = { wins: 0, losses: 0, draws: 0 };
      updateStatsUI();
      if (gameMode !== "online") {
        resetGameEngine(false);
      }
    });
  }

  // Setup panel choices toggling logic
  const createChoiceBtn = document.getElementById("btn-create-room-choice");
  if (createChoiceBtn) {
    createChoiceBtn.addEventListener("click", () => {
      const choiceContainer = document.getElementById("online-choice-container");
      const hostContainer = document.getElementById("online-host-container");
      if (choiceContainer) choiceContainer.style.display = "none";
      if (hostContainer) hostContainer.style.display = "flex";
      hostOnlineRoom();
    });
  }

  const joinChoiceBtn = document.getElementById("btn-join-room-choice");
  if (joinChoiceBtn) {
    joinChoiceBtn.addEventListener("click", () => {
      const choiceContainer = document.getElementById("online-choice-container");
      const joinContainer = document.getElementById("online-join-container");
      if (choiceContainer) choiceContainer.style.display = "none";
      if (joinContainer) joinContainer.style.display = "flex";
      updateOnlineStatus("Enter 6-digit room code to join.");
    });
  }

  const cancelHostBtn = document.getElementById("btn-cancel-host");
  if (cancelHostBtn) {
    cancelHostBtn.addEventListener("click", () => {
      leaveOnlineRoom();
    });
  }

  const backChoicesBtn = document.getElementById("btn-back-to-choices");
  if (backChoicesBtn) {
    backChoicesBtn.addEventListener("click", () => {
      const choiceContainer = document.getElementById("online-choice-container");
      const joinContainer = document.getElementById("online-join-container");
      if (choiceContainer) choiceContainer.style.display = "flex";
      if (joinContainer) joinContainer.style.display = "none";
      
      const codeInput = document.getElementById("room-code-input");
      if (codeInput) codeInput.value = "";
      updateOnlineStatus("");
    });
  }

  const submitJoinBtn = document.getElementById("btn-submit-join");
  if (submitJoinBtn) {
    submitJoinBtn.addEventListener("click", joinOnlineRoom);
  }
}

// Show/Hide bottom buttons dynamically based on match status
function configureActionButtonsUI() {
  const resetBtn = document.getElementById("btn-reset-game");
  const rematchBtn = document.getElementById("btn-rematch-online");
  const leaveBtn = document.getElementById("btn-leave-room");
  const resetStatsBtn = document.getElementById("btn-reset-stats");

  if (gameMode === "online") {
    if (resetBtn) resetBtn.style.display = "none";
    if (leaveBtn) leaveBtn.style.display = "inline-block";
    
    if (isOnlineMatch && !isGameActive && boardState.some(c => c !== "")) {
      // Game ended in Online Match
      if (rematchBtn) {
        rematchBtn.style.display = "inline-block";
        rematchBtn.disabled = rematchRequested;
        rematchBtn.textContent = rematchRequested ? "Waiting for Opponent..." : "Request Rematch";
      }
    } else {
      if (rematchBtn) rematchBtn.style.display = "none";
    }
  } else {
    if (resetBtn) resetBtn.style.display = "inline-block";
    if (rematchBtn) rematchBtn.style.display = "none";
    if (leaveBtn) leaveBtn.style.display = "none";
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
          updateGameStatusMessage(`Player O (${nicknameO}) won the toss and plays first!`);
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
      
      if (gameMode === "online") {
        if (currentTurn !== playerSymbol) return; // Block clicking if not our turn
        makeOnlineMove(index);
      } else {
        if (gameMode === "ai" && currentTurn === "O") return;
        makeMove(index, currentTurn);
      }
    });
  });
}

// Make a local move
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
      const activeName = currentTurn === "X" ? `${avatar} ${nickname}` : `⭕ ${nicknameO}`;
      updateGameStatusMessage(`${activeName}'s turn (${currentTurn})`);
      enableCells(true);
    }
  }
}

// AI Turn Engine
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
        updateGameStatusMessage(`🎉 ⭕ ${nicknameO} wins!`);
        stats.losses++;
      }
    }
  } else {
    updateGameStatusMessage(`🤝 It's a draw! Well played.`);
    stats.draws++;
  }

  updateStatsUI();

  // Reset board after 3 seconds for local/AI modes ONLY
  if (gameMode !== "online") {
    setTimeout(() => {
      resetGameEngine(false);
    }, 3000);
  } else {
    configureActionButtonsUI(); // Show "Request Rematch" button for online mode
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
  rematchRequested = false;
  
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
   Online Room Logic (RTDB Sync Matching Android App Flow)
   ========================================================================== */

function hostOnlineRoom() {
  if (!database) {
    updateOnlineStatus("Firebase not initialized!");
    return;
  }

  disconnectFromOnlineRoom();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  onlineRoomId = code;
  playerSymbol = "X";
  isOnlineMatch = true;

  updateOnlineStatus("Creating lobby...");

  // Update room code on Host UI display
  const codeDisplay = document.getElementById("display-room-code");
  if (codeDisplay) codeDisplay.textContent = code;

  const roomData = {
    roomId: code,
    playerXName: nickname,
    playerXAvatarId: avatar,
    playerOName: "",
    playerOAvatarId: "avatar_2", // Matches app defaults
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
    updateOnlineStatus(`Lobby Hosted! Code: ${code}`);
    roomRef.on("value", handleOnlineRoomUpdate);
    configureActionButtonsUI();
  }).catch((e) => {
    updateOnlineStatus("Error: " + e.message);
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
    updateOnlineStatus("Enter valid 6-digit code.");
    return;
  }

  disconnectFromOnlineRoom();
  updateOnlineStatus(`Joining room ${code}...`);

  const targetRoomRef = database.ref("rooms/" + code);
  targetRoomRef.once("value").then((snapshot) => {
    if (!snapshot.exists()) {
      updateOnlineStatus("Room code not found!");
      return;
    }

    const room = snapshot.val();
    if (room.status !== "WAITING") {
      updateOnlineStatus("Room is already full/active.");
      return;
    }

    onlineRoomId = code;
    playerSymbol = "O";
    isOnlineMatch = true;

    // Join room in Firebase
    targetRoomRef.update({
      playerOName: nickname,
      playerOAvatarId: avatar,
      status: "ACTIVE"
    }).then(() => {
      roomRef = targetRoomRef;
      roomRef.on("value", handleOnlineRoomUpdate);
      updateOnlineStatus(`Joined: ${code}`);
      configureActionButtonsUI();
    }).catch((e) => {
      updateOnlineStatus("Error joining: " + e.message);
    });
  }).catch((e) => {
    updateOnlineStatus("Fetch error: " + e.message);
  });
}

function handleOnlineRoomUpdate(snapshot) {
  const room = snapshot.val();
  if (!room) {
    updateGameStatusMessage("Room was closed by opponent.");
    disconnectFromOnlineRoom();
    resetGameEngine(true);
    configureActionButtonsUI();
    return;
  }

  currentRound = room.roundNumber || 1;
  stats.wins = room.scoreX || 0;
  stats.losses = room.scoreO || 0;
  stats.draws = room.drawsCount || 0;
  updateStatsUI();

  // Sync board array
  if (room.board) {
    boardState = room.board.map(val => val === "EMPTY" ? "" : val);
    renderBoardUI();
  }

  currentTurn = room.currentTurn || "X";

  // Check if both players requested rematch
  if (room.rematchX && room.rematchO) {
    if (playerSymbol === "X") {
      // Host resets the room in Firebase matching app's resetRoomForRematch flow
      roomRef.update({
        board: Array(9).fill("EMPTY"),
        currentTurn: "X", // Android app defaults back to starting X
        status: "ACTIVE",
        winnerSymbol: "EMPTY",
        rematchX: false,
        rematchO: false,
        roundNumber: currentRound + 1
      });
    }
  }

  // Handle room status sync
  if (room.status === "WAITING") {
    updateOnlineStatus(`Hosting Code: ${room.roomId}`);
    updateGameStatusMessage("Waiting for player to join...");
    isGameActive = false;
    enableCells(false);
  } 
  else if (room.status === "ACTIVE") {
    updateOnlineStatus(`Connected | Room: ${room.roomId}`);
    isGameActive = true;
    rematchRequested = false;

    const strikeLine = document.getElementById("winning-strike-line");
    if (strikeLine) {
      strikeLine.className = "mock-line";
    }

    // Check X or O turn
    if (currentTurn === playerSymbol) {
      updateGameStatusMessage(`Your turn (${playerSymbol})! Make a move.`);
      enableCells(true);
    } else {
      const oppName = playerSymbol === "X" 
        ? `${room.playerOAvatarId || "🤖"} ${room.playerOName || "Player O"}` 
        : `${room.playerXAvatarId || "🦊"} ${room.playerXName || "Player X"}`;
      updateGameStatusMessage(`Waiting for opponent ${oppName} (${currentTurn})...`);
      enableCells(false);
    }

    // Hide rematch button if match is active
    configureActionButtonsUI();
  } 
  else if (room.status === "WON") {
    isGameActive = false;
    enableCells(false);

    // Strike combination
    const check = checkWinCondition(boardState);
    if (check.win) {
      const strikeLine = document.getElementById("winning-strike-line");
      if (strikeLine) {
        strikeLine.className = `mock-line active ${check.combination.class}`;
      }
    }

    const winner = room.winnerSymbol;
    if (winner === playerSymbol) {
      updateGameStatusMessage(`🎉 Match Won!`);
    } else {
      updateGameStatusMessage(`💀 Match Lost! Winner: ${winner}`);
    }

    // Sync rematch requests
    rematchRequested = playerSymbol === "X" ? room.rematchX : room.rematchO;
    configureActionButtonsUI();
  } 
  else if (room.status === "DRAW") {
    isGameActive = false;
    enableCells(false);
    updateGameStatusMessage(`🤝 Match Draw!`);

    rematchRequested = playerSymbol === "X" ? room.rematchX : room.rematchO;
    configureActionButtonsUI();
  }
}

function makeOnlineMove(index) {
  if (!isGameActive || boardState[index] !== "" || currentTurn !== playerSymbol || !roomRef) return;

  boardState[index] = playerSymbol;
  renderBoardUI();

  const newBoard = boardState.map(val => val === "" ? "EMPTY" : val);
  const nextTurn = playerSymbol === "X" ? "O" : "X";

  // Temporarily post turn/move to Firebase
  roomRef.update({
    board: newBoard,
    currentTurn: nextTurn
  }).then(() => {
    // The player who made the move evaluates the result (matches OnlineGameViewModel.kt)
    const check = checkWinCondition(boardState);
    
    if (check.win) {
      const targetRoomRef = database.ref("rooms/" + onlineRoomId);
      targetRoomRef.once("value").then((snapshot) => {
        const room = snapshot.val();
        if (room) {
          const finalScoreX = (playerSymbol === "X") ? (room.scoreX || 0) + 1 : (room.scoreX || 0);
          const finalScoreO = (playerSymbol === "O") ? (room.scoreO || 0) + 1 : (room.scoreO || 0);
          
          roomRef.update({
            status: "WON",
            winnerSymbol: playerSymbol,
            scoreX: finalScoreX,
            scoreO: finalScoreO,
            drawsCount: room.drawsCount || 0
          });
        }
      });
    } else if (check.draw) {
      const targetRoomRef = database.ref("rooms/" + onlineRoomId);
      targetRoomRef.once("value").then((snapshot) => {
        const room = snapshot.val();
        if (room) {
          roomRef.update({
            status: "DRAW",
            winnerSymbol: "DRAW",
            scoreX: room.scoreX || 0,
            scoreO: room.scoreO || 0,
            drawsCount: (room.drawsCount || 0) + 1
          });
        }
      });
    }
  });
}

function requestOnlineRematch() {
  if (!roomRef || rematchRequested) return;

  rematchRequested = true;
  configureActionButtonsUI();
  updateGameStatusMessage("Waiting for opponent rematch request...");

  const updateKey = playerSymbol === "X" ? "rematchX" : "rematchO";
  roomRef.child(updateKey).setValue(true);
}

function leaveOnlineRoom() {
  leaveOnlineRoomQuietly();
}

function leaveOnlineRoomQuietly() {
  if (roomRef) {
    if (playerSymbol === "X") {
      roomRef.remove(); // Host deletes room node
    }
    roomRef.off();
    roomRef = null;
  }
  onlineRoomId = "";
  isOnlineMatch = false;
  rematchRequested = false;
  updateOnlineStatus("");

  // Restore choices layout
  const choiceContainer = document.getElementById("online-choice-container");
  const hostContainer = document.getElementById("online-host-container");
  const joinContainer = document.getElementById("online-join-container");
  if (choiceContainer) choiceContainer.style.display = "flex";
  if (hostContainer) hostContainer.style.display = "none";
  if (joinContainer) joinContainer.style.display = "none";

  const codeDisplay = document.getElementById("display-room-code");
  if (codeDisplay) codeDisplay.textContent = "------";

  const codeInput = document.getElementById("room-code-input");
  if (codeInput) codeInput.value = "";
}

function disconnectFromOnlineRoom() {
  leaveOnlineRoomQuietly();
}

function updateOnlineStatus(msg) {
  const statusLabel = document.getElementById("online-room-status");
  if (statusLabel) {
    statusLabel.textContent = msg;
  }
}
