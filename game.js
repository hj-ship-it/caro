// Game configuration
const BOARD_SIZE = 100;
const WIN_CONDITION = 5; // 5 in a row to win

// Game state
let board = Array(BOARD_SIZE * BOARD_SIZE).fill('');
let currentPlayer = 'X';
let gameActive = true;
let scores = {
    x: 0,
    o: 0,
    draw: 0
};

// Zoom and pan state
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let lastMoveIndex = -1;

// DOM elements
const boardElement = document.getElementById('board');
const boardContainer = document.getElementById('board-container');
const statusText = document.getElementById('current-player');
const resetBtn = document.getElementById('reset-btn');
const clearScoreBtn = document.getElementById('clear-score-btn');
const winnerMessage = document.getElementById('winner-message');
const winnerText = document.getElementById('winner-text');
const newGameBtn = document.getElementById('new-game-btn');
const scoreX = document.getElementById('score-x');
const scoreO = document.getElementById('score-o');
const scoreDraw = document.getElementById('score-draw');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const centerBtn = document.getElementById('center-btn');
const zoomLevel = document.getElementById('zoom-level');

// Initialize game
initializeBoard();
loadScores();
centerBoard();

// Event listeners
resetBtn.addEventListener('click', resetGame);
clearScoreBtn.addEventListener('click', clearScores);
newGameBtn.addEventListener('click', hideWinnerMessage);
zoomInBtn.addEventListener('click', () => zoom(0.2));
zoomOutBtn.addEventListener('click', () => zoom(-0.2));
centerBtn.addEventListener('click', centerBoard);

// Pan and zoom events
boardContainer.addEventListener('mousedown', startDrag);
boardContainer.addEventListener('mousemove', drag);
boardContainer.addEventListener('mouseup', endDrag);
boardContainer.addEventListener('mouseleave', endDrag);

// Touch events for mobile
boardContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
boardContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
boardContainer.addEventListener('touchend', handleTouchEnd);

// Pinch to zoom
let initialDistance = 0;
let initialScale = 1;

function initializeBoard() {
    boardElement.innerHTML = '';

    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        boardElement.appendChild(cell);
    }
}

function handleCellClick(event) {
    if (isDragging) return; // Don't place piece if dragging

    const clickedCell = event.target;
    const clickedCellIndex = parseInt(clickedCell.dataset.index);

    if (board[clickedCellIndex] !== '' || !gameActive) {
        return;
    }

    updateCell(clickedCell, clickedCellIndex);
    checkResult(clickedCellIndex);
}

function updateCell(cell, index) {
    board[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());

    // Remove last-move class from previous move
    if (lastMoveIndex >= 0) {
        const lastCell = boardElement.children[lastMoveIndex];
        if (lastCell) lastCell.classList.remove('last-move');
    }

    cell.classList.add('last-move');
    lastMoveIndex = index;
}

function changePlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusText.textContent = currentPlayer;
}

function checkResult(lastIndex) {
    const winningCells = checkWin(lastIndex);

    if (winningCells) {
        gameActive = false;
        highlightWinningCells(winningCells);
        showWinner(`Người chơi ${currentPlayer} thắng! 🎉`);
        updateScore(currentPlayer);
        return;
    }

    const isDraw = !board.includes('');
    if (isDraw) {
        gameActive = false;
        showWinner('Hòa! 🤝');
        updateScore('draw');
        return;
    }

    changePlayer();
}

function checkWin(lastIndex) {
    const row = Math.floor(lastIndex / BOARD_SIZE);
    const col = lastIndex % BOARD_SIZE;
    const player = board[lastIndex];

    // Directions: horizontal, vertical, diagonal-right, diagonal-left
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
            if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
            const index = newRow * BOARD_SIZE + newCol;
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
            if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
            const index = newRow * BOARD_SIZE + newCol;
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

function showWinner(message) {
    winnerText.textContent = message;
    winnerMessage.classList.add('show');
}

function hideWinnerMessage() {
    winnerMessage.classList.remove('show');
    resetGame();
}

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

function resetGame() {
    board = Array(BOARD_SIZE * BOARD_SIZE).fill('');
    gameActive = true;
    currentPlayer = 'X';
    statusText.textContent = currentPlayer;
    lastMoveIndex = -1;

    Array.from(boardElement.children).forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winner', 'last-move');
    });
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
    const savedScores = localStorage.getItem('caroScores');
    if (savedScores) {
        scores = JSON.parse(savedScores);
        scoreX.textContent = scores.x;
        scoreO.textContent = scores.o;
        scoreDraw.textContent = scores.draw;
    }
}

// Zoom and Pan functions
function zoom(delta) {
    const oldScale = scale;
    scale = Math.max(0.5, Math.min(5, scale + delta));

    // Adjust translate to zoom towards center
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
    const boardWidth = BOARD_SIZE * 20 * scale;
    const boardHeight = BOARD_SIZE * 20 * scale;

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
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    boardContainer.classList.add('grabbing');
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();

    translateX = e.clientX - startX;
    translateY = e.clientY - startY;

    updateTransform();
}

function endDrag() {
    // Delay to prevent click event after drag
    setTimeout(() => {
        isDragging = false;
    }, 50);
    boardContainer.classList.remove('grabbing');
}

// Touch handling
let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        // Single touch - pan
        touchStartX = e.touches[0].clientX - translateX;
        touchStartY = e.touches[0].clientY - translateY;
        touchMoved = false;
        isDragging = true;
        boardContainer.classList.add('grabbing');
    } else if (e.touches.length === 2) {
        // Two finger - pinch to zoom
        e.preventDefault();
        const distance = getDistance(e.touches[0], e.touches[1]);
        initialDistance = distance;
        initialScale = scale;
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 1 && isDragging) {
        // Single touch - pan
        e.preventDefault();
        touchMoved = true;

        translateX = e.touches[0].clientX - touchStartX;
        translateY = e.touches[0].clientY - touchStartY;

        updateTransform();
    } else if (e.touches.length === 2) {
        // Two finger - pinch to zoom
        e.preventDefault();
        const distance = getDistance(e.touches[0], e.touches[1]);
        const delta = distance - initialDistance;
        scale = Math.max(0.5, Math.min(5, initialScale + delta / 200));

        updateTransform();
    }
}

function handleTouchEnd(e) {
    if (e.touches.length === 0) {
        setTimeout(() => {
            isDragging = false;
            touchMoved = false;
        }, 50);
        boardContainer.classList.remove('grabbing');
    }
}

function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// Prevent context menu on long press
boardContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});
