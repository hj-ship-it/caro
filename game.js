// ==================== GAME CONFIGURATION ====================
const WIN_CONDITION = 5;
const CELL_SIZE = 28;

// ==================== GAME STATE ====================
let boardSize = 20;
let board = [];
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvp'; // 'pvp' or 'pve'
let aiDifficulty = 'medium';
let soundEnabled = true;
let timeLimit = 60; // seconds per turn, 0 = unlimited

let scores = { x: 0, o: 0, draw: 0 };
let moveHistory = [];
let redoStack = [];
let lastMoveIndex = -1;

// Timer state
let timerX = 0;
let timerO = 0;
let timerInterval = null;

// Zoom and pan state
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let dragMoved = false;
let startX = 0;
let startY = 0;

// Touch state
let initialDistance = 0;
let initialScale = 1;

// ==================== DOM ELEMENTS ====================
const settingsPanel = document.getElementById('settings-panel');
const gameArea = document.getElementById('game-area');
const boardElement = document.getElementById('board');
const boardContainer = document.getElementById('board-container');

// Settings elements
const gameModeRadios = document.querySelectorAll('input[name="gameMode"]');
const aiSettings = document.getElementById('ai-settings');
const aiDifficultySelect = document.getElementById('ai-difficulty');
const boardSizeSelect = document.getElementById('board-size');
const timeLimitSelect = document.getElementById('time-limit');
const soundToggle = document.getElementById('sound-toggle');
const startGameBtn = document.getElementById('start-game-btn');

// Game elements
const playerXInfo = document.getElementById('player-x-info');
const playerOInfo = document.getElementById('player-o-info');
const playerXName = document.getElementById('player-x-name');
const playerOName = document.getElementById('player-o-name');
const timerXElement = document.getElementById('timer-x');
const timerOElement = document.getElementById('timer-o');
const statusText = document.getElementById('status-text');
const scoreX = document.getElementById('score-x');
const scoreO = document.getElementById('score-o');
const scoreDraw = document.getElementById('score-draw');

// Toolbar elements
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const zoomLevel = document.getElementById('zoom-level');
const centerBtn = document.getElementById('center-btn');
const soundBtn = document.getElementById('sound-btn');

// Control buttons
const resetBtn = document.getElementById('reset-btn');
const settingsBtn = document.getElementById('settings-btn');
const clearScoreBtn = document.getElementById('clear-score-btn');

// Modal elements
const winnerModal = document.getElementById('winner-modal');
const winnerText = document.getElementById('winner-text');
const confetti = document.getElementById('confetti');
const newGameBtn = document.getElementById('new-game-btn');
const backSettingsBtn = document.getElementById('back-settings-btn');
const loadingModal = document.getElementById('loading-modal');

// ==================== AUDIO ====================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    initAudio();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    switch(type) {
        case 'move':
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.1);
            break;
        case 'win':
            oscillator.frequency.value = 523.25; // C5
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
            oscillator.start(audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
            oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.stop(audioCtx.currentTime + 0.5);
            break;
        case 'lose':
            oscillator.frequency.value = 300;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.4);
            break;
        case 'undo':
            oscillator.frequency.value = 400;
            oscillator.type = 'triangle';
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.1);
            break;
        case 'timeout':
            oscillator.frequency.value = 200;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
            for (let i = 0; i < 3; i++) {
                oscillator.frequency.setValueAtTime(200, audioCtx.currentTime + i * 0.2);
                oscillator.frequency.setValueAtTime(150, audioCtx.currentTime + i * 0.2 + 0.1);
            }
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.6);
            break;
    }
}

// ==================== INITIALIZATION ====================
loadScores();
loadSettings();
setupEventListeners();

function loadSettings() {
    const saved = localStorage.getItem('caroSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        boardSizeSelect.value = settings.boardSize || 20;
        timeLimitSelect.value = settings.timeLimit || 60;
        aiDifficultySelect.value = settings.aiDifficulty || 'medium';
        soundToggle.checked = settings.soundEnabled !== false;

        const modeRadio = document.querySelector(`input[name="gameMode"][value="${settings.gameMode || 'pvp'}"]`);
        if (modeRadio) modeRadio.checked = true;

        updateAISettingsVisibility();
    }
}

function saveSettings() {
    const settings = {
        boardSize: boardSizeSelect.value,
        timeLimit: timeLimitSelect.value,
        aiDifficulty: aiDifficultySelect.value,
        soundEnabled: soundToggle.checked,
        gameMode: document.querySelector('input[name="gameMode"]:checked').value
    };
    localStorage.setItem('caroSettings', JSON.stringify(settings));
}

function setupEventListeners() {
    // Settings panel
    gameModeRadios.forEach(radio => {
        radio.addEventListener('change', updateAISettingsVisibility);
    });
    startGameBtn.addEventListener('click', startGame);

    // Toolbar
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    zoomInBtn.addEventListener('click', () => zoom(0.2));
    zoomOutBtn.addEventListener('click', () => zoom(-0.2));
    centerBtn.addEventListener('click', centerBoard);
    soundBtn.addEventListener('click', toggleSound);

    // Controls
    resetBtn.addEventListener('click', resetGame);
    settingsBtn.addEventListener('click', showSettings);
    clearScoreBtn.addEventListener('click', clearScores);

    // Modals
    newGameBtn.addEventListener('click', () => {
        hideModal(winnerModal);
        resetGame();
    });
    backSettingsBtn.addEventListener('click', () => {
        hideModal(winnerModal);
        showSettings();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Pan and zoom
    boardContainer.addEventListener('mousedown', startDrag);
    boardContainer.addEventListener('mousemove', drag);
    boardContainer.addEventListener('mouseup', endDrag);
    boardContainer.addEventListener('mouseleave', endDrag);
    boardContainer.addEventListener('wheel', handleWheel, { passive: false });

    // Touch events
    boardContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    boardContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    boardContainer.addEventListener('touchend', handleTouchEnd);
    boardContainer.addEventListener('contextmenu', e => e.preventDefault());
}

function updateAISettingsVisibility() {
    const mode = document.querySelector('input[name="gameMode"]:checked').value;
    aiSettings.classList.toggle('show', mode === 'pve');
}

// ==================== GAME CONTROL ====================
function startGame() {
    // Read settings
    boardSize = parseInt(boardSizeSelect.value);
    timeLimit = parseInt(timeLimitSelect.value);
    aiDifficulty = aiDifficultySelect.value;
    soundEnabled = soundToggle.checked;
    gameMode = document.querySelector('input[name="gameMode"]:checked').value;

    saveSettings();

    // Update player names
    playerXName.textContent = 'Người chơi X';
    playerOName.textContent = gameMode === 'pve' ? 'AI' : 'Người chơi O';

    // Initialize game
    initializeBoard();
    resetGame();

    // Show game area
    settingsPanel.style.display = 'none';
    gameArea.classList.add('active');

    // Center board
    setTimeout(centerBoard, 100);

    updateSoundButton();
}

function showSettings() {
    stopTimer();
    gameArea.classList.remove('active');
    settingsPanel.style.display = 'flex';
}

function initializeBoard() {
    board = Array(boardSize * boardSize).fill('');
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${boardSize}, ${CELL_SIZE}px)`;
    boardElement.style.gridTemplateRows = `repeat(${boardSize}, ${CELL_SIZE}px)`;

    for (let i = 0; i < boardSize * boardSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        boardElement.appendChild(cell);
    }
}

function handleCellClick(event) {
    if (dragMoved) return;
    if (!gameActive) return;
    if (gameMode === 'pve' && currentPlayer === 'O') return;

    const clickedCell = event.target;
    const clickedCellIndex = parseInt(clickedCell.dataset.index);

    if (board[clickedCellIndex] !== '') return;

    makeMove(clickedCellIndex);
}

function makeMove(index, isAI = false) {
    const cell = boardElement.children[index];

    // Update board state
    board[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());

    // Update last move highlight
    if (lastMoveIndex >= 0) {
        boardElement.children[lastMoveIndex].classList.remove('last-move');
    }
    cell.classList.add('last-move');
    lastMoveIndex = index;

    // Add to history
    moveHistory.push({ index, player: currentPlayer });
    redoStack = [];
    updateUndoRedoButtons();

    // Play sound
    playSound('move');

    // Check result
    const winningCells = checkWin(index);
    if (winningCells) {
        gameActive = false;
        stopTimer();
        highlightWinningCells(winningCells);

        const isPlayerWin = currentPlayer === 'X' || (gameMode === 'pvp');
        playSound(isPlayerWin ? 'win' : 'lose');

        setTimeout(() => {
            showWinner(`${currentPlayer === 'X' ? 'Người chơi X' : (gameMode === 'pve' ? 'AI' : 'Người chơi O')} thắng!`);
            updateScore(currentPlayer);
        }, 500);
        return;
    }

    // Check draw
    if (!board.includes('')) {
        gameActive = false;
        stopTimer();
        setTimeout(() => {
            showWinner('Hòa!');
            updateScore('draw');
        }, 300);
        return;
    }

    // Switch player
    changePlayer();

    // AI move
    if (gameMode === 'pve' && currentPlayer === 'O' && gameActive) {
        setTimeout(makeAIMove, 300);
    }
}

function changePlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updatePlayerDisplay();
    resetTurnTimer();
}

function updatePlayerDisplay() {
    playerXInfo.classList.toggle('active', currentPlayer === 'X');
    playerOInfo.classList.toggle('active', currentPlayer === 'O');
}

function resetGame() {
    board = Array(boardSize * boardSize).fill('');
    gameActive = true;
    currentPlayer = 'X';
    moveHistory = [];
    redoStack = [];
    lastMoveIndex = -1;

    Array.from(boardElement.children).forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winner', 'last-move', 'hint');
    });

    updatePlayerDisplay();
    updateUndoRedoButtons();
    resetTurnTimer();
    startTimer();
}

// ==================== TIMER ====================
function startTimer() {
    if (timeLimit === 0) {
        timerXElement.textContent = '--:--';
        timerOElement.textContent = '--:--';
        return;
    }

    timerX = timeLimit;
    timerO = timeLimit;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        if (!gameActive) {
            stopTimer();
            return;
        }

        if (currentPlayer === 'X') {
            timerX--;
            if (timerX <= 0) {
                handleTimeout('X');
            }
        } else {
            timerO--;
            if (timerO <= 0) {
                handleTimeout('O');
            }
        }

        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTurnTimer() {
    if (timeLimit === 0) return;

    if (currentPlayer === 'X') {
        timerX = timeLimit;
    } else {
        timerO = timeLimit;
    }
    updateTimerDisplay();
}

function updateTimerDisplay() {
    if (timeLimit === 0) return;

    timerXElement.textContent = formatTime(timerX);
    timerOElement.textContent = formatTime(timerO);

    // Warning colors
    timerXElement.classList.remove('warning', 'danger');
    timerOElement.classList.remove('warning', 'danger');

    if (timerX <= 10) timerXElement.classList.add('danger');
    else if (timerX <= 30) timerXElement.classList.add('warning');

    if (timerO <= 10) timerOElement.classList.add('danger');
    else if (timerO <= 30) timerOElement.classList.add('warning');
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function handleTimeout(player) {
    gameActive = false;
    stopTimer();
    playSound('timeout');

    const winner = player === 'X' ? 'O' : 'X';
    const winnerName = winner === 'X' ? 'Người chơi X' : (gameMode === 'pve' ? 'AI' : 'Người chơi O');

    setTimeout(() => {
        showWinner(`Hết giờ! ${winnerName} thắng!`);
        updateScore(winner);
    }, 300);
}

// ==================== UNDO / REDO ====================
function undo() {
    if (moveHistory.length === 0 || !gameActive) return;

    // In PvE mode, undo both AI and player moves
    const movesToUndo = (gameMode === 'pve' && moveHistory.length >= 2 &&
                         moveHistory[moveHistory.length - 1].player === 'O') ? 2 : 1;

    for (let i = 0; i < movesToUndo && moveHistory.length > 0; i++) {
        const lastMove = moveHistory.pop();
        redoStack.push(lastMove);

        board[lastMove.index] = '';
        const cell = boardElement.children[lastMove.index];
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'last-move');
    }

    // Update last move highlight
    if (moveHistory.length > 0) {
        const prevMove = moveHistory[moveHistory.length - 1];
        boardElement.children[prevMove.index].classList.add('last-move');
        lastMoveIndex = prevMove.index;
        currentPlayer = prevMove.player === 'X' ? 'O' : 'X';
    } else {
        lastMoveIndex = -1;
        currentPlayer = 'X';
    }

    updatePlayerDisplay();
    updateUndoRedoButtons();
    resetTurnTimer();
    playSound('undo');
}

function redo() {
    if (redoStack.length === 0 || !gameActive) return;

    const move = redoStack.pop();
    board[move.index] = move.player;

    const cell = boardElement.children[move.index];
    cell.textContent = move.player;
    cell.classList.add(move.player.toLowerCase());

    if (lastMoveIndex >= 0) {
        boardElement.children[lastMoveIndex].classList.remove('last-move');
    }
    cell.classList.add('last-move');
    lastMoveIndex = move.index;

    moveHistory.push(move);
    currentPlayer = move.player === 'X' ? 'O' : 'X';

    updatePlayerDisplay();
    updateUndoRedoButtons();
    resetTurnTimer();
    playSound('move');

    // If in PvE mode and it's AI's turn, make AI move
    if (gameMode === 'pve' && currentPlayer === 'O' && gameActive) {
        setTimeout(makeAIMove, 300);
    }
}

function updateUndoRedoButtons() {
    undoBtn.disabled = moveHistory.length === 0 || !gameActive;
    redoBtn.disabled = redoStack.length === 0 || !gameActive;
}

// ==================== AI ====================
function makeAIMove() {
    if (!gameActive || currentPlayer !== 'O') return;

    showModal(loadingModal);

    setTimeout(() => {
        const move = getBestMove();
        hideModal(loadingModal);

        if (move !== -1) {
            makeMove(move, true);
        }
    }, 300);
}

function getBestMove() {
    const emptyCells = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') emptyCells.push(i);
    }

    if (emptyCells.length === 0) return -1;

    // First move - play near center
    if (emptyCells.length === boardSize * boardSize) {
        const center = Math.floor(boardSize / 2) * boardSize + Math.floor(boardSize / 2);
        return center;
    }

    // If only one move has been made, play adjacent to it
    if (emptyCells.length === boardSize * boardSize - 1) {
        const lastMove = moveHistory[0].index;
        const adjacent = getAdjacentCells(lastMove);
        const validAdjacent = adjacent.filter(i => board[i] === '');
        if (validAdjacent.length > 0) {
            return validAdjacent[Math.floor(Math.random() * validAdjacent.length)];
        }
    }

    // Evaluate all possible moves
    let bestScore = -Infinity;
    let bestMoves = [];

    // Get cells near existing pieces for efficiency
    const candidateCells = getCandidateCells();

    for (const index of candidateCells) {
        if (board[index] !== '') continue;

        const score = evaluateMove(index);

        if (score > bestScore) {
            bestScore = score;
            bestMoves = [index];
        } else if (score === bestScore) {
            bestMoves.push(index);
        }
    }

    // Add randomness based on difficulty
    if (aiDifficulty === 'easy' && Math.random() < 0.4) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    if (aiDifficulty === 'medium' && Math.random() < 0.2) {
        const randomCandidates = candidateCells.filter(i => board[i] === '');
        if (randomCandidates.length > 0) {
            return randomCandidates[Math.floor(Math.random() * randomCandidates.length)];
        }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function getCandidateCells() {
    const candidates = new Set();
    const range = 2;

    for (let i = 0; i < board.length; i++) {
        if (board[i] !== '') {
            const row = Math.floor(i / boardSize);
            const col = i % boardSize;

            for (let dr = -range; dr <= range; dr++) {
                for (let dc = -range; dc <= range; dc++) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
                        const index = newRow * boardSize + newCol;
                        if (board[index] === '') {
                            candidates.add(index);
                        }
                    }
                }
            }
        }
    }

    return Array.from(candidates);
}

function getAdjacentCells(index) {
    const row = Math.floor(index / boardSize);
    const col = index % boardSize;
    const adjacent = [];

    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
                adjacent.push(newRow * boardSize + newCol);
            }
        }
    }

    return adjacent;
}

function evaluateMove(index) {
    let score = 0;

    // Check AI's potential (O)
    board[index] = 'O';
    const aiPatterns = evaluatePosition(index, 'O');
    board[index] = '';

    // Check player's potential (X)
    board[index] = 'X';
    const playerPatterns = evaluatePosition(index, 'X');
    board[index] = '';

    // Scoring based on patterns
    // Win immediately
    if (aiPatterns.five) return 1000000;
    // Block opponent's win
    if (playerPatterns.five) return 900000;

    // Create open four
    if (aiPatterns.openFour) score += 100000;
    // Block opponent's open four
    if (playerPatterns.openFour) score += 80000;

    // Create four (one side blocked)
    if (aiPatterns.four) score += 10000;
    if (playerPatterns.four) score += 8000;

    // Create open three
    if (aiPatterns.openThree) score += 5000;
    if (playerPatterns.openThree) score += 4000;

    // Create three
    if (aiPatterns.three) score += 500;
    if (playerPatterns.three) score += 400;

    // Create two
    if (aiPatterns.two) score += 50;
    if (playerPatterns.two) score += 40;

    // Prefer center positions
    const row = Math.floor(index / boardSize);
    const col = index % boardSize;
    const centerDist = Math.abs(row - boardSize/2) + Math.abs(col - boardSize/2);
    score += Math.max(0, boardSize - centerDist);

    return score;
}

function evaluatePosition(index, player) {
    const row = Math.floor(index / boardSize);
    const col = index % boardSize;

    const patterns = {
        five: false,
        openFour: false,
        four: false,
        openThree: false,
        three: false,
        two: false
    };

    const directions = [
        [0, 1],   // horizontal
        [1, 0],   // vertical
        [1, 1],   // diagonal right
        [1, -1]   // diagonal left
    ];

    for (const [dx, dy] of directions) {
        let count = 1;
        let openEnds = 0;
        let blockedEnds = 0;

        // Check positive direction
        let i = 1;
        while (i < WIN_CONDITION) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            if (newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize) {
                blockedEnds++;
                break;
            }
            const cellIndex = newRow * boardSize + newCol;
            if (board[cellIndex] === player) {
                count++;
                i++;
            } else if (board[cellIndex] === '') {
                openEnds++;
                break;
            } else {
                blockedEnds++;
                break;
            }
        }
        if (i >= WIN_CONDITION && count < WIN_CONDITION) blockedEnds++;

        // Check negative direction
        i = 1;
        while (i < WIN_CONDITION) {
            const newRow = row - dx * i;
            const newCol = col - dy * i;
            if (newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize) {
                blockedEnds++;
                break;
            }
            const cellIndex = newRow * boardSize + newCol;
            if (board[cellIndex] === player) {
                count++;
                i++;
            } else if (board[cellIndex] === '') {
                openEnds++;
                break;
            } else {
                blockedEnds++;
                break;
            }
        }
        if (i >= WIN_CONDITION && count < WIN_CONDITION) blockedEnds++;

        // Analyze pattern
        if (count >= 5) {
            patterns.five = true;
        } else if (count === 4) {
            if (openEnds === 2) patterns.openFour = true;
            else if (openEnds === 1) patterns.four = true;
        } else if (count === 3) {
            if (openEnds === 2) patterns.openThree = true;
            else if (openEnds === 1) patterns.three = true;
        } else if (count === 2) {
            if (openEnds >= 1) patterns.two = true;
        }
    }

    return patterns;
}

// ==================== WIN CHECKING ====================
function checkWin(lastIndex) {
    const row = Math.floor(lastIndex / boardSize);
    const col = lastIndex % boardSize;
    const player = board[lastIndex];

    const directions = [
        [0, 1],   // horizontal
        [1, 0],   // vertical
        [1, 1],   // diagonal right
        [1, -1]   // diagonal left
    ];

    for (const [dx, dy] of directions) {
        const cells = [lastIndex];

        // Check positive direction
        for (let i = 1; i < WIN_CONDITION; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            if (newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize) break;
            const index = newRow * boardSize + newCol;
            if (board[index] === player) {
                cells.push(index);
            } else {
                break;
            }
        }

        // Check negative direction
        for (let i = 1; i < WIN_CONDITION; i++) {
            const newRow = row - dx * i;
            const newCol = col - dy * i;
            if (newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize) break;
            const index = newRow * boardSize + newCol;
            if (board[index] === player) {
                cells.push(index);
            } else {
                break;
            }
        }

        if (cells.length >= WIN_CONDITION) {
            return cells;
        }
    }

    return null;
}

function highlightWinningCells(cells) {
    cells.forEach(index => {
        boardElement.children[index].classList.add('winner');
    });
}

// ==================== SCORE ====================
function updateScore(winner) {
    if (winner === 'X') {
        scores.x++;
        scoreX.textContent = scores.x;
    } else if (winner === 'O') {
        scores.o++;
        scoreO.textContent = scores.o;
    } else {
        scores.draw++;
        scoreDraw.textContent = scores.draw;
    }
    saveScores();
}

function clearScores() {
    scores = { x: 0, o: 0, draw: 0 };
    scoreX.textContent = 0;
    scoreO.textContent = 0;
    scoreDraw.textContent = 0;
    saveScores();
}

function saveScores() {
    localStorage.setItem('caroScores', JSON.stringify(scores));
}

function loadScores() {
    const saved = localStorage.getItem('caroScores');
    if (saved) {
        scores = JSON.parse(saved);
        scoreX.textContent = scores.x;
        scoreO.textContent = scores.o;
        scoreDraw.textContent = scores.draw;
    }
}

// ==================== MODALS ====================
function showModal(modal) {
    modal.classList.add('show');
}

function hideModal(modal) {
    modal.classList.remove('show');
}

function showWinner(message) {
    winnerText.textContent = message;
    createConfetti();
    showModal(winnerModal);
}

function createConfetti() {
    confetti.innerHTML = '';
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#ffd700', '#28a745'];

    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 2 + 's';
        piece.style.animationDuration = (2 + Math.random() * 2) + 's';
        confetti.appendChild(piece);
    }
}

// ==================== ZOOM & PAN ====================
function zoom(delta) {
    const oldScale = scale;
    scale = Math.max(0.3, Math.min(5, scale + delta));

    const containerRect = boardContainer.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    const scaleRatio = scale / oldScale;
    translateX = centerX - (centerX - translateX) * scaleRatio;
    translateY = centerY - (centerY - translateY) * scaleRatio;

    updateTransform();
}

function centerBoard() {
    const containerRect = boardContainer.getBoundingClientRect();
    const boardWidth = boardSize * CELL_SIZE * scale;
    const boardHeight = boardSize * CELL_SIZE * scale;

    translateX = (containerRect.width - boardWidth) / 2;
    translateY = (containerRect.height - boardHeight) / 2;

    updateTransform();
}

function updateTransform() {
    boardElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    zoomLevel.textContent = Math.round(scale * 100) + '%';
}

function startDrag(e) {
    isDragging = true;
    dragMoved = false;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    boardContainer.classList.add('grabbing');
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();

    const dx = e.clientX - startX - translateX;
    const dy = e.clientY - startY - translateY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragMoved = true;
    }

    translateX = e.clientX - startX;
    translateY = e.clientY - startY;

    updateTransform();
}

function endDrag() {
    isDragging = false;
    boardContainer.classList.remove('grabbing');

    setTimeout(() => {
        dragMoved = false;
    }, 50);
}

function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoom(delta);
}

// Touch handling
function handleTouchStart(e) {
    if (e.touches.length === 1) {
        isDragging = true;
        dragMoved = false;
        startX = e.touches[0].clientX - translateX;
        startY = e.touches[0].clientY - translateY;
        boardContainer.classList.add('grabbing');
    } else if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialScale = scale;
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - startX - translateX;
        const dy = e.touches[0].clientY - startY - translateY;

        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            e.preventDefault();
            dragMoved = true;
        }

        translateX = e.touches[0].clientX - startX;
        translateY = e.touches[0].clientY - startY;

        updateTransform();
    } else if (e.touches.length === 2) {
        e.preventDefault();
        const distance = getDistance(e.touches[0], e.touches[1]);
        scale = Math.max(0.3, Math.min(5, initialScale * (distance / initialDistance)));
        updateTransform();
    }
}

function handleTouchEnd(e) {
    if (e.touches.length === 0) {
        isDragging = false;
        boardContainer.classList.remove('grabbing');

        setTimeout(() => {
            dragMoved = false;
        }, 50);
    }
}

function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// ==================== KEYBOARD SHORTCUTS ====================
function handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
            e.preventDefault();
            undo();
        } else if (e.key === 'y') {
            e.preventDefault();
            redo();
        }
    }
}

// ==================== SOUND ====================
function toggleSound() {
    soundEnabled = !soundEnabled;
    updateSoundButton();

    // Save to settings
    const settings = JSON.parse(localStorage.getItem('caroSettings') || '{}');
    settings.soundEnabled = soundEnabled;
    localStorage.setItem('caroSettings', JSON.stringify(settings));
}

function updateSoundButton() {
    soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
}
