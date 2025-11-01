// Game state
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let scores = {
    x: 0,
    o: 0,
    draw: 0
};

// Winning combinations
const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// DOM elements
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('current-player');
const resetBtn = document.getElementById('reset-btn');
const clearScoreBtn = document.getElementById('clear-score-btn');
const winnerMessage = document.getElementById('winner-message');
const winnerText = document.getElementById('winner-text');
const newGameBtn = document.getElementById('new-game-btn');
const scoreX = document.getElementById('score-x');
const scoreO = document.getElementById('score-o');
const scoreDraw = document.getElementById('score-draw');

// Load scores from localStorage
loadScores();

// Event listeners
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', resetGame);
clearScoreBtn.addEventListener('click', clearScores);
newGameBtn.addEventListener('click', hideWinnerMessage);

function handleCellClick(event) {
    const clickedCell = event.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (board[clickedCellIndex] !== '' || !gameActive) {
        return;
    }

    updateCell(clickedCell, clickedCellIndex);
    checkResult();
}

function updateCell(cell, index) {
    board[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
}

function changePlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusText.textContent = currentPlayer;
}

function checkResult() {
    let roundWon = false;
    let winningCombination = null;

    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] === '' || board[b] === '' || board[c] === '') {
            continue;
        }
        if (board[a] === board[b] && board[b] === board[c]) {
            roundWon = true;
            winningCombination = [a, b, c];
            break;
        }
    }

    if (roundWon) {
        gameActive = false;
        highlightWinningCells(winningCombination);
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

function highlightWinningCells(combination) {
    combination.forEach(index => {
        cells[index].classList.add('winner');
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
    board = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    statusText.textContent = currentPlayer;

    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winner');
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
    localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
}

function loadScores() {
    const savedScores = localStorage.getItem('ticTacToeScores');
    if (savedScores) {
        scores = JSON.parse(savedScores);
        scoreX.textContent = scores.x;
        scoreO.textContent = scores.o;
        scoreDraw.textContent = scores.draw;
    }
}
