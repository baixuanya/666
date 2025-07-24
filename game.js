const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 10;
const COLS = 10;
const CELL_SIZE = 40;
const MINES_COUNT = 15;

let board = [];
let revealed = [];
let flagged = [];
let gameOver = false;
let mineCount = MINES_COUNT;
let flagCount = 0;
let cellsToReveal = ROWS * COLS - MINES_COUNT;

function initBoard() {
    board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    revealed = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    flagged = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    gameOver = false;
    flagCount = 0;
    cellsToReveal = ROWS * COLS - MINES_COUNT;
    // 随机布雷
    let mines = 0;
    while (mines < MINES_COUNT) {
        let r = Math.floor(Math.random() * ROWS);
        let c = Math.floor(Math.random() * COLS);
        if (board[r][c] === 'M') continue;
        board[r][c] = 'M';
        mines++;
    }
    // 计算数字
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === 'M') continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    let nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === 'M') count++;
                }
            }
            board[r][c] = count;
        }
    }
    updateInfo();
}

function updateInfo() {
    document.getElementById('mineCount').textContent = '地雷数: ' + MINES_COUNT;
    document.getElementById('flagCount').textContent = '已插旗: ' + flagCount;
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let x = c * CELL_SIZE;
            let y = r * CELL_SIZE;
            // 背景
            ctx.fillStyle = revealed[r][c] ? '#e0ffe0' : '#b2d8b2';
            ctx.strokeStyle = '#2db400';
            ctx.lineWidth = 2;
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
            // 插旗
            if (flagged[r][c]) {
                ctx.fillStyle = '#ff5252';
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE/2, y + CELL_SIZE/2, 10, 0, 2*Math.PI);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px 微软雅黑';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('旗', x + CELL_SIZE/2, y + CELL_SIZE/2);
            }
            // 显示数字或雷
            if (revealed[r][c]) {
                if (board[r][c] === 'M') {
                    ctx.fillStyle = '#333';
                    ctx.font = 'bold 22px 微软雅黑';
                    ctx.fillText('💣', x + CELL_SIZE/2, y + CELL_SIZE/2 + 2);
                } else if (board[r][c] > 0) {
                    ctx.fillStyle = '#2db400';
                    ctx.font = 'bold 20px 微软雅黑';
                    ctx.fillText(board[r][c], x + CELL_SIZE/2, y + CELL_SIZE/2 + 2);
                }
            }
        }
    }
}

function playOpenSound() {
    const openSound = document.getElementById('openSound');
    if (openSound) { openSound.currentTime = 0; openSound.play(); }
}
function playFlagSound() {
    const flagSound = document.getElementById('flagSound');
    if (flagSound) { flagSound.currentTime = 0; flagSound.play(); }
}
function playMineSound() {
    const mineSound = document.getElementById('mineSound');
    if (mineSound) { mineSound.currentTime = 0; mineSound.play(); }
}
function playWinSound() {
    const winSound = document.getElementById('winSound');
    if (winSound) { winSound.currentTime = 0; winSound.play(); }
}

function revealCell(r, c) {
    if (revealed[r][c] || flagged[r][c] || gameOver) return;
    revealed[r][c] = true;
    if (board[r][c] === 'M') {
        gameOver = true;
        revealAllMines();
        playMineSound();
        setTimeout(() => alert('游戏失败！'), 100);
        drawBoard();
        return;
    }
    playOpenSound();
    cellsToReveal--;
    if (cellsToReveal === 0) {
        gameOver = true;
        playWinSound();
        setTimeout(() => alert('恭喜你，扫雷成功！'), 100);
        drawBoard();
        return;
    }
    // 空白递归展开
    if (board[r][c] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                let nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    revealCell(nr, nc);
                }
            }
        }
    }
    drawBoard();
}

function revealAllMines() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === 'M') revealed[r][c] = true;
        }
    }
}

canvas.addEventListener('mousedown', function(e) {
    if (gameOver) return;
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    let c = Math.floor(x / CELL_SIZE);
    let r = Math.floor(y / CELL_SIZE);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (e.button === 0) {
        // 左键开格
        revealCell(r, c);
    } else if (e.button === 2) {
        // 右键插旗
        if (!revealed[r][c]) {
            flagged[r][c] = !flagged[r][c];
            flagCount += flagged[r][c] ? 1 : -1;
            playFlagSound();
            updateInfo();
            drawBoard();
        }
    }
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

initBoard();
drawBoard(); 