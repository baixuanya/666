const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const COLS = 10;
const ROWS = 1;
const CARD_WIDTH = 70;
const CARD_HEIGHT = 100;
const CARD_GAP = 15;
const SUIT = '♠';
const TOTAL_DECKS = 8; // 8组A~K

let piles = [];
let stock = [];
let dragging = null;
let offsetX = 0, offsetY = 0;
let win = false;
let SUITS = ['♠'];
let difficulty = 1;

function getSuitsByDifficulty(diff) {
    if (diff == 1) return ['♠'];
    if (diff == 2) return ['♠', '♥'];
    return ['♠', '♥', '♣', '♦'];
}

// 预加载牌背图片
const cardBackImg = new Image();
// 确保图片文件路径正确
cardBackImg.src = '../assets/spider_cards/zhipaibeimian.png';

function initGame() {
    // 读取难度
    const diffSel = document.getElementById('difficulty');
    difficulty = diffSel ? parseInt(diffSel.value) : 1;
    SUITS = getSuitsByDifficulty(difficulty);
    piles = Array.from({length: COLS}, () => []);
    stock = [];
    win = false;
    // 生成牌组
    let cards = [];
    for (let d = 0; d < TOTAL_DECKS; d++) {
        for (let v = 1; v <= 13; v++) {
            let suit = SUITS[d % SUITS.length];
            cards.push({value: v, suit: suit, faceUp: true});
        }
    }
    // 洗牌
    for (let i = cards.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    // 发初始牌，每列最后一张为正面，其余为背面
    for (let i = 0; i < 54; i++) {
        let pileIdx = i % COLS;
        let card = cards.pop();
        card.faceUp = false;
        piles[pileIdx].push(card);
    }
    for (let c = 0; c < COLS; c++) {
        if (piles[c].length > 0) {
            piles[c][piles[c].length - 1].faceUp = true;
        }
    }
    // 剩余为stock
    while (cards.length) {
        let card = cards.pop();
        card.faceUp = false;
        stock.push(card);
    }
    draw();
}

function draw() {
    // 赌桌绿色背景
    ctx.fillStyle = '#20732d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // 画牌堆
    for (let c = 0; c < COLS; c++) {
        let pile = piles[c];
        for (let r = 0; r < pile.length; r++) {
            let card = pile[r];
            let x = c * (CARD_WIDTH + CARD_GAP) + 30;
            let y = r * 30 + 40;
            drawCard(card, x, y, dragging && dragging.pile === c && dragging.index <= r);
        }
    }
    // 画stock
    ctx.fillStyle = stock.length ? '#2db400' : '#aaa';
    ctx.fillRect(30, 10, CARD_WIDTH, CARD_HEIGHT/2);
    ctx.fillStyle = '#fff';
    ctx.font = '18px 微软雅黑';
    ctx.textAlign = 'center';
    ctx.fillText('发牌', 30 + CARD_WIDTH/2, 10 + CARD_HEIGHT/4 + 6);
    // 胜利提示
    if (win) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '48px 微软雅黑';
        ctx.textAlign = 'center';
        ctx.fillText('恭喜通关！', canvas.width/2, canvas.height/2);
    }
}

function drawCard(card, x, y, dragging) {
    ctx.save();
    ctx.globalAlpha = dragging ? 0.5 : 1;
    if (card.faceUp === false) {
        // 显示牌背图片
        if (cardBackImg.complete) {
            ctx.drawImage(cardBackImg, x, y, CARD_WIDTH, CARD_HEIGHT);
        } else {
            ctx.fillStyle = '#20732d';
            ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);
        }
        ctx.restore();
        return;
    }
    // 经典扑克牌白底
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, CARD_WIDTH, CARD_HEIGHT, 10);
    ctx.fill();
    ctx.stroke();
    // 红黑花色
    let isRed = card.suit === '♥' || card.suit === '♦';
    ctx.fillStyle = isRed ? '#d22' : '#222';
    ctx.font = 'bold 28px 微软雅黑';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    // 左上角数字
    ctx.fillText(card.value, x+8, y+6);
    ctx.font = '22px 微软雅黑';
    ctx.fillText(card.suit, x+8, y+36);
    // 右下角
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 28px 微软雅黑';
    ctx.fillText(card.value, x+CARD_WIDTH-8, y+CARD_HEIGHT-10);
    ctx.font = '22px 微软雅黑';
    ctx.fillText(card.suit, x+CARD_WIDTH-8, y+CARD_HEIGHT-36);
    ctx.restore();
}

function flipCardWithAnimation(pile, r, c) {
    let card = pile[r];
    let x = c * (CARD_WIDTH + CARD_GAP) + 30;
    let y = r * 30 + 40;
    let progress = 0;
    let duration = 350; // ms
    let start = null;
    let playedSound = false;
    function animateFlip(ts) {
        if (!start) start = ts;
        progress = (ts - start) / duration;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
        // 用clearRect清除原牌区域，完全透明
        ctx.clearRect(x-8, y-8, CARD_WIDTH+16, CARD_HEIGHT+16);
        let scale = progress < 0.5 ? 1 - progress*2 : (progress-0.5)*2;
        let isBack = progress < 0.5;
        ctx.translate(x + CARD_WIDTH/2, y + CARD_HEIGHT/2);
        ctx.scale(scale, 1);
        ctx.translate(-CARD_WIDTH/2, -CARD_HEIGHT/2);
        // 动画美化：加阴影
        ctx.shadowColor = '#222';
        ctx.shadowBlur = 16 * (1-Math.abs(0.5-progress));
        if (isBack) {
            // 画背面
            if (cardBackImg.complete) {
                ctx.drawImage(cardBackImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);
            } else {
                ctx.fillStyle = '#20732d';
                ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
            }
        } else {
            // 只播放一次音效
            if (!playedSound) {
                const flipSound = document.getElementById('flipSound');
                if (flipSound) { flipSound.currentTime = 0; flipSound.play(); }
                playedSound = true;
            }
            // 画正面
            // 仅在scale接近1时显示白底，否则为透明
            if (scale > 0.95) {
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
                ctx.fill();
                ctx.stroke();
                // 高光
                let grad = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
                grad.addColorStop(0, 'rgba(255,255,255,0.18)');
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT/2);
            }
            let isRed = card.suit === '♥' || card.suit === '♦';
            ctx.fillStyle = isRed ? '#d22' : '#222';
            ctx.font = 'bold 28px 微软雅黑';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(card.value, 8, 6);
            ctx.font = '22px 微软雅黑';
            ctx.fillText(card.suit, 8, 36);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.font = 'bold 28px 微软雅黑';
            ctx.fillText(card.value, CARD_WIDTH-8, CARD_HEIGHT-10);
            ctx.font = '22px 微软雅黑';
            ctx.fillText(card.suit, CARD_WIDTH-8, CARD_HEIGHT-36);
        }
        ctx.restore();
        if (progress < 1) {
            requestAnimationFrame(animateFlip);
        } else {
            card.faceUp = true;
            draw();
        }
    }
    requestAnimationFrame(animateFlip);
}

// 点击背面牌可翻为正面
canvas.addEventListener('mousedown', e => {
    if (win) return;
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    // 检查发牌
    if (mx >= 30 && mx <= 30+CARD_WIDTH && my >= 10 && my <= 10+CARD_HEIGHT/2 && stock.length) {
        for (let c = 0; c < COLS; c++) {
            if (stock.length) {
                let card = stock.pop();
                card.faceUp = false;
                piles[c].push(card);
            }
        }
        // 每列最上面一张翻为正面
        for (let c = 0; c < COLS; c++) {
            if (piles[c].length > 0) {
                piles[c][piles[c].length - 1].faceUp = true;
            }
        }
        draw();
        return;
    }
    // 检查牌堆
    for (let c = 0; c < COLS; c++) {
        let pile = piles[c];
        for (let r = pile.length-1; r >= 0; r--) {
            let x = c * (CARD_WIDTH + CARD_GAP) + 30;
            let y = r * 30 + 40;
            if (mx >= x && mx <= x+CARD_WIDTH && my >= y && my <= y+CARD_HEIGHT) {
                if (pile[r].faceUp === false && r === pile.length-1) {
                    flipCardWithAnimation(pile, r, c);
                    return;
                }
                if (pile[r].faceUp) {
                    dragging = {pile: c, index: r, dx: mx-x, dy: my-y};
                    offsetX = mx-x;
                    offsetY = my-y;
                    return;
                }
            }
        }
    }
});
canvas.addEventListener('mousemove', e => {
    if (!dragging) return;
    draw();
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    let pile = piles[dragging.pile];
    for (let r = dragging.index; r < pile.length; r++) {
        let card = pile[r];
        let x = mx - offsetX;
        let y = my - offsetY + (r-dragging.index)*30;
        drawCard(card, x, y, true);
    }
});
canvas.addEventListener('mouseup', e => {
    if (!dragging) return;
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    let fromPile = piles[dragging.pile];
    let moving = fromPile.slice(dragging.index);
    // 检查目标堆
    for (let c = 0; c < COLS; c++) {
        let x = c * (CARD_WIDTH + CARD_GAP) + 30;
        let y = 40 + (piles[c].length)*30;
        if (mx >= x && mx <= x+CARD_WIDTH && my >= y-30 && my <= y+CARD_HEIGHT) {
            // 获取目标牌堆
            let target = piles[c];
            // 规则：目标堆为空或顶牌比移动的第一张大 1 且花色相同
            if (target.length === 0 || (target[target.length - 1].value === moving[0].value + 1 && target[target.length - 1].suit === moving[0].suit)) {
                // 移动
                piles[dragging.pile] = fromPile.slice(0, dragging.index);
                piles[c] = piles[c].concat(moving);
                checkWin();
                draw();
                dragging = null;
                return;
            }
        }
    }
    draw();
    dragging = null;
});

function checkWin() {
    let complete = 0;
    for (let c = 0; c < COLS; c++) {
        let pile = piles[c];
        if (pile.length >= 13) {
            let seq = pile.slice(-13);
            // 检查是否为连续的 13 张相同花色的牌
            if (seq.every((card, i) => card.value === 13 - i) && new Set(seq.map(card => card.suit)).size === 1) { 
                piles[c] = pile.slice(0, -13);
                complete++;
            }
        }
    }
    if (complete > 0 && piles.every(pile => pile.length === 0 || pile.length < 13)) {
        win = true;
    }
}

function startGame() {
    initGame();
}

// 监听难度选择变化
const diffSel = document.getElementById('difficulty');
if (diffSel) {
    diffSel.onchange = function() {
        // 可选择是否在切换难度时立即更新
        // initGame(); 
    };
}

// 移除原有的自动初始化
// initGame();
// draw();

// 添加触摸事件支持
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('mousemove', e => {
    if (!dragging) return;
    draw();
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    let pile = piles[dragging.pile];
    for (let r = dragging.index; r < pile.length; r++) {
        let card = pile[r];
        let x = mx - offsetX;
        let y = my - offsetY + (r-dragging.index)*30;
        drawCard(card, x, y, true);
    }
});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('mouseup', e => {
    if (!dragging) return;
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    let fromPile = piles[dragging.pile];
    let moving = fromPile.slice(dragging.index);
    // 检查目标堆
    for (let c = 0; c < COLS; c++) {
        let x = c * (CARD_WIDTH + CARD_GAP) + 30;
        let y = 40 + (piles[c].length)*30;
        if (mx >= x && mx <= x+CARD_WIDTH && my >= y-30 && my <= y+CARD_HEIGHT) {
            // 获取目标牌堆
            let target = piles[c];
            // 规则：目标堆为空或顶牌比移动的第一张大 1 且花色相同
            if (target.length === 0 || (target[target.length - 1].value === moving[0].value + 1 && target[target.length - 1].suit === moving[0].suit)) {
                // 移动
                piles[dragging.pile] = fromPile.slice(0, dragging.index);
                piles[c] = piles[c].concat(moving);
                checkWin();
                draw();
                dragging = null;
                return;
            }
        }
    }
    draw();
    dragging = null;
});

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
});