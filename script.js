// Game state management
let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let selectedPlayers = 1;
let highScoreValue = 30000;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Cargar todas las imágenes
const images = {
    player: new Image(),
    enemy: new Image(),
    ladybug: new Image(),
    king: new Image(),
    bossBlue: new Image(),
    bossRed: new Image(),
    bossPurple: new Image(),
    bossMulticolor: new Image(),
    background: new Image(),
    explosionEnemy: [],
    explosionPlayer: []
};

// Load player sprite
images.player.src = 'galaga_sprites_transparent/player.png';
images.enemy.src = 'galaga_sprites_transparent/boss_red_frame_00.png';
images.ladybug.src = 'galaga_sprites_transparent/boss_purple_frame_00.png';
images.king.src = 'galaga_sprites_transparent/boss_multicolor_frame_00.png';
images.bossBlue.src = 'galaga_sprites_transparent/boss_blue_frame_00.png';
images.bossRed.src = 'galaga_sprites_transparent/boss_red_frame_00.png';
images.bossPurple.src = 'galaga_sprites_transparent/boss_purple_frame_00.png';
images.bossMulticolor.src = 'galaga_sprites_transparent/boss_multicolor_frame_00.png';
images.background.src = 'galaga_sprites_transparent/Arcade - Galaga Arrangement - Backgrounds - Level Backgrounds.png';

// Load explosion frames
for (let i = 0; i < 5; i++) {
    const img = new Image();
    img.src = `galaga_sprites_transparent/explosion_enemy_frame_${i}.png`;
    images.explosionEnemy.push(img);
}
for (let i = 0; i < 4; i++) {
    const img = new Image();
    img.src = `galaga_sprites_transparent/explosion_player_frame_${i}.png`;
    images.explosionPlayer.push(img);
}

let imagesLoaded = 0;
const totalImages = 9 + 5 + 4; // 9 sprites + 5 enemy explosion frames + 4 player explosion frames
let gameStarted = false;

// Cargar imágenes antes de iniciar
const singleImages = [images.player, images.enemy, images.ladybug, images.king,
                      images.bossBlue, images.bossRed, images.bossPurple,
                      images.bossMulticolor, images.background];

singleImages.forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        updateLoadingStatus();
    };
    img.onerror = () => {
        console.error('Failed to load image:', img.src);
    };
});

images.explosionEnemy.forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        updateLoadingStatus();
    };
    img.onerror = () => {
        console.error('Failed to load image:', img.src);
    };
});

images.explosionPlayer.forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        updateLoadingStatus();
    };
    img.onerror = () => {
        console.error('Failed to load image:', img.src);
    };
});

function updateLoadingStatus() {
    const startPrompt = document.querySelector('.start-prompt');
    if (startPrompt) {
        if (imagesLoaded < totalImages) {
            startPrompt.textContent = `LOADING... ${imagesLoaded}/${totalImages}`;
        } else {
            startPrompt.textContent = 'PRESS SPACE TO START';
            console.log('All images loaded. Menu ready.');
        }
    }
}

// Variables del juego
let score = 0;
let lives = 3;
let level = 1;
let gameOver = false;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let explosions = [];
let backgroundOffset = 0;
let levelingUp = false; // Prevent multiple level ups

// Starfield for background
let stars = [];

// Create starfield
function createStarfield() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 1 + 0.5,
            brightness: Math.random()
        });
    }
}

// Update and draw starfield
function updateStarfield() {
    for (let star of stars) {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    }
}

function drawStarfield() {
    for (let star of stars) {
        const alpha = 0.3 + star.brightness * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Configuración del jugador
const player = {
    x: canvas.width / 2 - 30,
    y: canvas.height - 100,
    width: 50,
    height: 60,
    speed: 6,
    frameIndex: 0,
    animationCounter: 0
};

// Controles
const keys = {};

document.addEventListener('keydown', (e) => {
    if (gameState === 'menu') {
        handleMenuInput(e);
    } else if (gameState === 'playing') {
        keys[e.key] = true;
        if (e.key === ' ') {
            e.preventDefault();
            shoot();
        }
    }

    if (e.key === 'r' || e.key === 'R') {
        if (gameOver) {
            resetGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Menu Functions
function handleMenuInput(e) {
    const option1 = document.getElementById('option1Player');
    const option2 = document.getElementById('option2Players');

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        // Toggle selection
        if (selectedPlayers === 1) {
            selectedPlayers = 2;
            option1.classList.remove('selected');
            option1.querySelector('.selector').textContent = '';
            option2.classList.add('selected');
            option2.querySelector('.selector').textContent = '▶';
        } else {
            selectedPlayers = 1;
            option2.classList.remove('selected');
            option2.querySelector('.selector').textContent = '';
            option1.classList.add('selected');
            option1.querySelector('.selector').textContent = '▶';
        }
    }

    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        startGame();
    }
}

function startGame() {
    // Check if images are loaded
    if (imagesLoaded !== totalImages) {
        console.log('Images still loading...', imagesLoaded, '/', totalImages);
        return;
    }

    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';

    if (!gameStarted) {
        // First time starting the game
        initGame();
    } else {
        // Restart game from menu
        gameState = 'playing';
        score = 0;
        lives = 3;
        level = 1;
        gameOver = false;
        bullets = [];
        enemyBullets = [];
        explosions = [];
        backgroundOffset = 0;
        player.x = canvas.width / 2 - 30;
        player.y = canvas.height - 100;
        document.getElementById('gameOverText').textContent = '';
        createStarfield();
        createEnemies();
        updateUI();
        gameLoop();
    }
}

function showMenu() {
    gameState = 'menu';
    document.getElementById('menuScreen').style.display = 'flex';
    document.getElementById('gameScreen').style.display = 'none';

    // Update high score display
    if (score > highScoreValue) {
        highScoreValue = score;
        document.getElementById('highScore').textContent = highScoreValue.toString().padStart(5, '0');
    }
    document.getElementById('player1Score').textContent = score.toString().padStart(2, '0');
}

// Click handlers for menu options
document.addEventListener('DOMContentLoaded', () => {
    const option1 = document.getElementById('option1Player');
    const option2 = document.getElementById('option2Players');

    option1.addEventListener('click', () => {
        selectedPlayers = 1;
        option2.classList.remove('selected');
        option2.querySelector('.selector').textContent = '';
        option1.classList.add('selected');
        option1.querySelector('.selector').textContent = '▶';
    });

    option2.addEventListener('click', () => {
        selectedPlayers = 2;
        option1.classList.remove('selected');
        option1.querySelector('.selector').textContent = '';
        option2.classList.add('selected');
        option2.querySelector('.selector').textContent = '▶';
    });
});

// Clase de Explosión
class Explosion {
    constructor(x, y, type = 'enemy') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.frame = 0;
        this.totalFrames = type === 'enemy' ? 5 : 4;
        this.animationSpeed = 3;
        this.animationCounter = 0;
        this.finished = false;
        this.size = 50; // Tamaño de la explosión
    }

    update() {
        this.animationCounter++;
        if (this.animationCounter >= this.animationSpeed) {
            this.frame++;
            this.animationCounter = 0;
            if (this.frame >= this.totalFrames) {
                this.finished = true;
            }
        }
    }

    draw() {
        if (this.finished) return;

        const explosionFrames = this.type === 'enemy' ? images.explosionEnemy : images.explosionPlayer;
        const img = explosionFrames[this.frame];

        if (img && img.complete) {
            ctx.drawImage(
                img,
                this.x - this.size / 2,
                this.y - this.size / 2,
                this.size,
                this.size
            );
        }
    }
}

// Clase Enemy
class Enemy {
    constructor(x, y, type, variant = null) {
        this.x = x;
        this.y = y;
        this.formationX = x; // Posición original en formación
        this.formationY = y;
        this.type = type; // 1: butterfly, 2: ladybug, 3: king, 4+: boss variants
        this.variant = variant; // Para bosses: 'blue', 'red', 'purple', 'multicolor'
        this.speedX = 1.0; // Reducido de 1.5 a 1.0 para movimiento más lento
        this.speedY = 0;
        this.alive = true;
        this.shootTimer = Math.random() * 400 + 200; // Mayor rango para más variación
        this.animationFrame = 0;
        this.animationCounter = 0;

        // Estados de comportamiento
        this.state = 'formation'; // 'formation', 'diving', 'returning'
        this.diveTimer = Math.random() * 2000 + 1000; // 1-3 segundos, muy variado
        this.divePath = []; // Ruta de ataque curva
        this.pathIndex = 0;
        this.returnSpeed = 3;

        // Dimensiones según el tipo
        if (type === 1) { // Butterfly (enemy.png)
            this.width = 45;
            this.height = 45;
            this.frameWidth = 33;
            this.frameHeight = 33;
            this.totalFrames = 2;
            this.diveChance = 0.15; // 15% chance cuando el timer expira
            this.points = 80;
        } else if (type === 2) { // Ladybug
            this.width = 40;
            this.height = 40;
            this.frameWidth = 33;
            this.frameHeight = 33;
            this.totalFrames = 2;
            this.diveChance = 0.20; // 20% chance cuando el timer expira
            this.points = 50;
        } else if (type === 3) { // King
            this.width = 50;
            this.height = 50;
            this.frameWidth = 64;
            this.frameHeight = 64;
            this.totalFrames = 5;
            this.diveChance = 0.10; // 10% chance (más cauteloso)
            this.points = 150;
        } else if (type >= 4) { // Boss variants
            this.width = 55;
            this.height = 55;
            this.frameWidth = 32;
            this.frameHeight = 32;
            this.totalFrames = 1;
            this.diveChance = 0.08; // 8% chance (muy cauteloso)
            this.points = 200 + (type - 4) * 50; // 200-350 puntos
        }
    }

    draw() {
        if (!this.alive) return;

        let img;
        if (this.type === 1) {
            img = images.enemy;
        } else if (this.type === 2) {
            img = images.ladybug;
        } else if (this.type === 3) {
            img = images.king;
        } else if (this.type >= 4) {
            // Boss variants
            if (this.variant === 'blue') {
                img = images.bossBlue;
            } else if (this.variant === 'red') {
                img = images.bossRed;
            } else if (this.variant === 'purple') {
                img = images.bossPurple;
            } else {
                img = images.bossMulticolor;
            }
        }

        if (img && img.complete) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.PI / 2); // Rotate 90 degrees clockwise
            ctx.drawImage(
                img,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
            ctx.restore();
        }
    }

    update() {
        if (this.state === 'formation') {
            // Movimiento en formación
            this.x += this.speedX;

            // Decidir si iniciar ataque de picada (solo cuando el timer llega a 0)
            this.diveTimer--;
            if (this.diveTimer <= 0) {
                // Solo algunos enemigos atacan, no todos
                if (Math.random() < this.diveChance) {
                    this.startDive();
                }
                // Reiniciar timer independientemente de si ataca o no
                this.diveTimer = Math.random() * 2000 + 1500; // Mucho más tiempo entre intentos
            }

            // Disparar ocasionalmente desde formación
            this.shootTimer--;
            if (this.shootTimer <= 0 && Math.random() < 0.01) { // Reducido de 0.015 a 0.01
                this.enemyShoot();
                this.shootTimer = Math.random() * 500 + 300; // Mayor variación entre disparos
            }
        } else if (this.state === 'diving') {
            // Seguir la ruta de ataque
            if (this.pathIndex < this.divePath.length) {
                const target = this.divePath[this.pathIndex];
                this.x = target.x;
                this.y = target.y;
                this.pathIndex++;

                // Disparar más frecuentemente durante el ataque
                this.shootTimer--;
                if (this.shootTimer <= 0 && Math.random() < 0.05) { // Reducido de 0.08 a 0.05
                    this.enemyShoot(true); // Disparo dirigido
                    this.shootTimer = Math.random() * 150 + 80; // Mayor intervalo
                }
            } else {
                // Terminar picada y comenzar retorno
                this.state = 'returning';
            }
        } else if (this.state === 'returning') {
            // Regresar a la formación
            const dx = this.formationX - this.x;
            const dy = this.formationY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 5) {
                this.x += (dx / distance) * this.returnSpeed;
                this.y += (dy / distance) * this.returnSpeed;
            } else {
                // Volver al estado de formación
                this.x = this.formationX;
                this.y = this.formationY;
                this.state = 'formation';
                this.diveTimer = Math.random() * 2000 + 1500; // Esperar más antes del próximo ataque
            }
        }
    }

    startDive() {
        this.state = 'diving';
        this.divePath = [];
        this.pathIndex = 0;

        // Crear ruta de ataque curva hacia el jugador
        const startX = this.x;
        const startY = this.y;
        const targetX = player.x + player.width / 2;

        // Determinar si atacar por la izquierda o derecha
        const side = Math.random() < 0.5 ? -1 : 1;
        const curveAmount = 200 * side;

        // Fase 1: Bajar hacia el jugador
        const steps1 = 40;
        const midY = Math.min(canvas.height - 150, player.y + 50); // No bajar demasiado

        for (let i = 0; i <= steps1; i++) {
            const t = i / steps1;

            const controlX = startX + curveAmount;
            const controlY = startY + (midY - startY) * 0.5;

            const x = Math.pow(1 - t, 2) * startX +
                      2 * (1 - t) * t * controlX +
                      Math.pow(t, 2) * targetX;
            const y = Math.pow(1 - t, 2) * startY +
                      2 * (1 - t) * t * controlY +
                      Math.pow(t, 2) * midY;

            this.divePath.push({ x, y });
        }

        // Fase 2: Curva hacia arriba por el lado opuesto
        const steps2 = 35;
        const exitX = side > 0 ? canvas.width - 50 : 50; // Mantenerse dentro del canvas
        const returnY = 30; // Volver arriba

        for (let i = 1; i <= steps2; i++) {
            const t = i / steps2;

            // Curva suave de regreso
            const x = targetX + (exitX - targetX) * t;
            const y = midY - (midY - returnY) * (t * t); // Aceleración cuadrática hacia arriba

            this.divePath.push({ x, y });
        }
    }

    enemyShoot(aimed = false) {
        if (aimed) {
            // Disparo dirigido hacia el jugador (más lento)
            const angle = Math.atan2(
                player.y - this.y,
                player.x + player.width / 2 - this.x
            );
            enemyBullets.push({
                x: this.x,
                y: this.y + 15,
                width: 5,
                height: 12,
                speedX: Math.cos(angle) * 2.5, // Reducido de 4 a 2.5
                speedY: Math.sin(angle) * 2.5, // Reducido de 4 a 2.5
                speed: 3,
                color: '#ff0000',
                aimed: true
            });
        } else {
            // Disparo recto hacia abajo (más lento)
            enemyBullets.push({
                x: this.x,
                y: this.y + 15,
                width: 5,
                height: 12,
                speedX: 0,
                speedY: 3, // Reducido de 5 a 3
                speed: 3,
                color: '#ff0000',
                aimed: false
            });
        }
    }
}

// Clase Bullet
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 15;
        this.speed = 8;
        this.color = '#ffff00';
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    update() {
        this.y -= this.speed;
    }
}

// Crear enemigos con formaciones aleatorias
function createEnemies() {
    enemies = [];
    const bossVariants = ['blue', 'red', 'purple', 'multicolor'];

    // Elegir un patrón de formación aleatorio
    const formations = [
        'classic',      // Filas rectas clásicas
        'vshape',       // Forma de V
        'diamond',      // Forma de diamante
        'wave',         // Patrón ondulado
        'scattered',    // Disperso
        'circle',       // Formación circular
        'arrow',        // Flecha apuntando abajo
        'cross',        // Cruz o X
        'spiral',       // Espiral
        'zigzag',       // Zig-zag
        'heart',        // Corazón
        'pyramid',      // Pirámide
        'wings',        // Alas de mariposa
        'hourglass',    // Reloj de arena
        'hexagon'       // Hexágono
    ];

    const pattern = formations[Math.floor(Math.random() * formations.length)];
    const enemyCount = Math.min(25 + level * 3, 50); // Más enemigos en niveles altos

    console.log(`Level ${level}: Creating ${pattern} formation with ~${enemyCount} enemies`);

    switch(pattern) {
        case 'classic':
            createClassicFormation(enemyCount, bossVariants);
            break;
        case 'vshape':
            createVFormation(enemyCount, bossVariants);
            break;
        case 'diamond':
            createDiamondFormation(enemyCount, bossVariants);
            break;
        case 'wave':
            createWaveFormation(enemyCount, bossVariants);
            break;
        case 'scattered':
            createScatteredFormation(enemyCount, bossVariants);
            break;
        case 'circle':
            createCircleFormation(enemyCount, bossVariants);
            break;
        case 'arrow':
            createArrowFormation(enemyCount, bossVariants);
            break;
        case 'cross':
            createCrossFormation(enemyCount, bossVariants);
            break;
        case 'spiral':
            createSpiralFormation(enemyCount, bossVariants);
            break;
        case 'zigzag':
            createZigzagFormation(enemyCount, bossVariants);
            break;
        case 'heart':
            createHeartFormation(enemyCount, bossVariants);
            break;
        case 'pyramid':
            createPyramidFormation(enemyCount, bossVariants);
            break;
        case 'wings':
            createWingsFormation(enemyCount, bossVariants);
            break;
        case 'hourglass':
            createHourglassFormation(enemyCount, bossVariants);
            break;
        case 'hexagon':
            createHexagonFormation(enemyCount, bossVariants);
            break;
    }
}

// Formación clásica en filas
function createClassicFormation(count, bossVariants) {
    const rows = Math.min(4 + Math.floor(level / 2), 5);
    const cols = Math.min(Math.ceil(count / rows), 10);
    const startX = canvas.width / 2 - (cols * 60) / 2;
    const startY = 80;
    const spacing = 60;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let type = row === 0 ? 3 : (row <= 2 ? 1 : 2);
            let variant = null;

            if (type === 3 && level >= 3) {
                type = 4 + (col % 4);
                variant = bossVariants[col % 4];
            }

            enemies.push(new Enemy(
                startX + col * spacing,
                startY + row * spacing,
                type,
                variant
            ));
        }
    }
}

// Formación en V
function createVFormation(count, bossVariants) {
    const centerX = canvas.width / 2;
    const startY = 80;
    const spacing = 50;
    const rows = Math.min(Math.ceil(count / 5), 8);

    for (let row = 0; row < rows; row++) {
        const enemiesInRow = Math.min(2 + row, 10);
        for (let i = 0; i < enemiesInRow; i++) {
            const offset = (i - enemiesInRow / 2) * spacing;
            const type = row < 2 ? 3 : (Math.random() > 0.5 ? 1 : 2);
            let variant = null;

            if (type === 3 && level >= 3) {
                variant = bossVariants[i % 4];
            }

            enemies.push(new Enemy(
                centerX + offset,
                startY + row * spacing,
                type,
                variant
            ));
        }
    }
}

// Formación en diamante
function createDiamondFormation(count, bossVariants) {
    const centerX = canvas.width / 2;
    const centerY = 200;
    const layers = Math.min(Math.ceil(count / 8), 5);
    const spacing = 50;

    for (let layer = 0; layer < layers; layer++) {
        const radius = (layer + 1) * spacing;
        const enemiesInLayer = 4 + layer * 2;

        for (let i = 0; i < enemiesInLayer; i++) {
            const angle = (Math.PI * 2 * i) / enemiesInLayer;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius * 0.6;

            const type = layer === 0 ? 3 : (Math.random() > 0.5 ? 1 : 2);
            let variant = null;

            if (type === 3 && level >= 3) {
                variant = bossVariants[i % 4];
            }

            enemies.push(new Enemy(x, y, type, variant));
        }
    }
}

// Formación ondulada
function createWaveFormation(count, bossVariants) {
    const rows = Math.min(Math.ceil(count / 8), 6);
    const cols = 8;
    const startX = canvas.width / 2 - (cols * 60) / 2;
    const startY = 80;
    const spacing = 60;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const waveOffset = Math.sin(col * 0.5) * 30;
            const type = row < 2 ? 3 : (col % 2 === 0 ? 1 : 2);
            let variant = null;

            if (type === 3 && level >= 3) {
                variant = bossVariants[col % 4];
            }

            enemies.push(new Enemy(
                startX + col * spacing,
                startY + row * spacing + waveOffset,
                type,
                variant
            ));
        }
    }
}

// Formación dispersa
function createScatteredFormation(count, bossVariants) {
    const minX = 80;
    const maxX = canvas.width - 80;
    const minY = 80;
    const maxY = 300;
    const minDistance = 50; // Distancia mínima entre enemigos

    for (let i = 0; i < count; i++) {
        let x, y, tooClose;
        let attempts = 0;

        do {
            x = minX + Math.random() * (maxX - minX);
            y = minY + Math.random() * (maxY - minY);
            tooClose = false;

            // Verificar distancia con otros enemigos
            for (let enemy of enemies) {
                const dx = enemy.formationX - x;
                const dy = enemy.formationY - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < minDistance) {
                    tooClose = true;
                    break;
                }
            }
            attempts++;
        } while (tooClose && attempts < 50);

        const type = Math.random() > 0.7 ? 3 : (Math.random() > 0.5 ? 1 : 2);
        let variant = null;

        if (type === 3 && level >= 3) {
            variant = bossVariants[i % 4];
        }

        enemies.push(new Enemy(x, y, type, variant));
    }
}

// Formación circular
function createCircleFormation(count, bossVariants) {
    const centerX = canvas.width / 2;
    const centerY = 200;
    const circles = Math.min(Math.ceil(count / 12), 4);

    for (let circle = 0; circle < circles; circle++) {
        const radius = 60 + circle * 50;
        const enemiesInCircle = 8 + circle * 4;

        for (let i = 0; i < enemiesInCircle; i++) {
            const angle = (Math.PI * 2 * i) / enemiesInCircle;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius * 0.5;

            const type = circle === 0 ? 3 : (circle === 1 ? 1 : 2);
            let variant = null;

            if (type === 3 && level >= 3) {
                variant = bossVariants[i % 4];
            }

            enemies.push(new Enemy(x, y, type, variant));
        }
    }
}

// Formación flecha apuntando abajo
function createArrowFormation(count, bossVariants) {
    const centerX = canvas.width / 2;
    const startY = 80;
    const spacing = 50;
    const rows = Math.min(Math.ceil(count / 6), 8);

    for (let row = 0; row < rows; row++) {
        const width = Math.min(row + 1, 6);
        for (let i = 0; i < width; i++) {
            const offset = (i - width / 2 + 0.5) * spacing;
            const type = row < 2 ? 3 : (Math.random() > 0.5 ? 1 : 2);
            let variant = null;

            if (type === 3 && level >= 3) {
                variant = bossVariants[i % 4];
            }

            enemies.push(new Enemy(centerX + offset, startY + row * spacing, type, variant));
        }
    }
}

// Formación en cruz o X
function createCrossFormation(count, bossVariants) {
    const centerX = canvas.width / 2;
    const centerY = 180;
    const arms = 4;
    const enemiesPerArm = Math.min(Math.ceil(count / arms), 6); // Limit arm length
    const spacing = 40;

    for (let arm = 0; arm < arms; arm++) {
        const angle = (Math.PI * 2 * arm) / arms + Math.PI / 4; // 45 degree offset for X
        for (let i = 1; i <= enemiesPerArm; i++) {
            const distance = i * spacing;
            let x = centerX + Math.cos(angle) * distance;
            let y = centerY + Math.sin(angle) * distance * 0.5;

            // Clamp positions to safe zone
            x = Math.max(60, Math.min(canvas.width - 60, x));
            y = Math.max(60, Math.min(320, y));

            const type = i <= 2 ? 3 : (Math.random() > 0.5 ? 1 : 2);
            let variant = null;

            if (type === 3 && level >= 3) {
                variant = bossVariants[arm % 4];
            }

            enemies.push(new Enemy(x, y, type, variant));
        }
    }
}

// Formación en espiral
function createSpiralFormation(count, bossVariants) {
    const centerX = canvas.width / 2;
    const centerY = 180;
    const angleStep = 0.5;
    const radiusStep = 2.5;
    const maxRadius = 200;

    for (let i = 0; i < count; i++) {
        const angle = i * angleStep;
        const radius = Math.min(30 + i * radiusStep, maxRadius);
        let x = centerX + Math.cos(angle) * radius;
        let y = centerY + Math.sin(angle) * radius * 0.5;

        // Clamp positions to safe zone
        x = Math.max(60, Math.min(canvas.width - 60, x));
        y = Math.max(60, Math.min(350, y));

        const type = i < 5 ? 3 : (i % 2 === 0 ? 1 : 2);
        let variant = null;

        if (type === 3 && level >= 3) {
            variant = bossVariants[i % 4];
        }

        enemies.push(new Enemy(x, y, type, variant));
    }
}

// Formación zigzag
function createZigzagFormation(count, bossVariants) {
    const rows = Math.min(Math.ceil(count / 6), 8);
    const spacing = 60;
    const startY = 80;

    for (let row = 0; row < rows; row++) {
        const cols = 6;
        const zigzagOffset = (row % 2) * 30;
        const startX = canvas.width / 2 - (cols * spacing) / 2 + zigzagOffset;

        for (let col = 0; col < cols; col++) {
            const type = row < 2 ? 3 : (col % 2 === 0 ? 1 : 2);
            let variant = null;

            if (type === 3 && level >= 3) {
                variant = bossVariants[col % 4];
            }

            enemies.push(new Enemy(
                startX + col * spacing,
                startY + row * spacing,
                type,
                variant
            ));
        }
    }
}

// Formación corazón
function createHeartFormation(count, bossVariants) {
    const centerX = canvas.width / 2;
    const centerY = 180;
    const scale = 15; // Reduced scale to fit better

    for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        // Parametric heart equation
        let x = centerX + scale * 16 * Math.pow(Math.sin(t), 3);
        let y = centerY - scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 13;

        // Clamp positions to safe zone
        x = Math.max(60, Math.min(canvas.width - 60, x));
        y = Math.max(60, Math.min(300, y));

        const type = i < 8 ? 3 : (i % 2 === 0 ? 1 : 2);
        let variant = null;

        if (type === 3 && level >= 3) {
            variant = bossVariants[i % 4];
        }

        enemies.push(new Enemy(x, y, type, variant));
    }
}

// Formación pirámide
function createPyramidFormation(count, bossVariants) {
    const centerX = canvas.width / 2;
    const startY = 80;
    const spacing = 50;
    const rows = Math.min(Math.ceil(Math.sqrt(count * 2)), 8);

    for (let row = 0; row < rows; row++) {
        const enemiesInRow = rows - row;
        for (let i = 0; i < enemiesInRow; i++) {
            const offset = (i - enemiesInRow / 2 + 0.5) * spacing;
            const type = row === 0 ? 3 : (row <= 2 ? 1 : 2);
            let variant = null;

            if (type === 3 && level >= 3) {
                variant = bossVariants[i % 4];
            }

            enemies.push(new Enemy(
                centerX + offset,
                startY + row * spacing,
                type,
                variant
            ));
        }
    }
}

// Formación alas de mariposa
function createWingsFormation(count, bossVariants) {
    const centerX = canvas.width / 2;
    const centerY = 180;
    const wingWidth = 120;
    const layers = Math.min(Math.ceil(count / 10), 4);

    // Left wing
    for (let layer = 0; layer < layers; layer++) {
        const enemiesInLayer = 5;
        for (let i = 0; i < enemiesInLayer; i++) {
            const angle = (Math.PI * i) / (enemiesInLayer - 1) - Math.PI / 2;
            const radius = 40 + layer * 25;
            let x = centerX - wingWidth / 2 + Math.cos(angle) * radius;
            let y = centerY + Math.sin(angle) * radius * 0.8;

            // Clamp to safe zone
            x = Math.max(60, Math.min(canvas.width - 60, x));
            y = Math.max(60, Math.min(300, y));

            const type = layer === 0 ? 3 : (i % 2 === 0 ? 1 : 2);
            let variant = null;

            if (type === 3 && level >= 3) {
                variant = bossVariants[i % 4];
            }

            enemies.push(new Enemy(x, y, type, variant));
        }
    }

    // Right wing
    for (let layer = 0; layer < layers; layer++) {
        const enemiesInLayer = 5;
        for (let i = 0; i < enemiesInLayer; i++) {
            const angle = (Math.PI * i) / (enemiesInLayer - 1) + Math.PI / 2;
            const radius = 40 + layer * 25;
            let x = centerX + wingWidth / 2 + Math.cos(angle) * radius;
            let y = centerY + Math.sin(angle) * radius * 0.8;

            // Clamp to safe zone
            x = Math.max(60, Math.min(canvas.width - 60, x));
            y = Math.max(60, Math.min(300, y));

            const type = layer === 0 ? 3 : (i % 2 === 0 ? 1 : 2);
            let variant = null;

            if (type === 3 && level >= 3) {
                variant = bossVariants[i % 4];
            }

            enemies.push(new Enemy(x, y, type, variant));
        }
    }
}

// Formación reloj de arena
function createHourglassFormation(count, bossVariants) {
    const centerX = canvas.width / 2;
    const startY = 80;
    const spacing = 50;
    const rows = Math.min(Math.ceil(count / 5), 8); // Reduce max rows to 8
    const midPoint = Math.floor(rows / 2);

    for (let row = 0; row < rows; row++) {
        let width;
        if (row <= midPoint) {
            width = Math.max(1, 6 - row);
        } else {
            width = Math.max(1, row - midPoint + 1);
        }

        for (let i = 0; i < width; i++) {
            const offset = (i - width / 2 + 0.5) * spacing;
            let x = centerX + offset;
            let y = startY + row * spacing;

            // Clamp positions to safe zone
            x = Math.max(60, Math.min(canvas.width - 60, x));
            y = Math.max(60, Math.min(350, y));

            const type = row === midPoint ? 3 : (Math.random() > 0.5 ? 1 : 2);
            let variant = null;

            if (type === 3 && level >= 3) {
                variant = bossVariants[i % 4];
            }

            enemies.push(new Enemy(x, y, type, variant));
        }
    }
}

// Formación hexagonal
function createHexagonFormation(count, bossVariants) {
    const centerX = canvas.width / 2;
    const centerY = 180;
    const layers = Math.min(Math.ceil(count / 12), 3); // Limit to 3 layers

    for (let layer = 0; layer < layers; layer++) {
        const radius = 40 + layer * 40; // Smaller radius to keep in bounds
        const enemiesInLayer = layer === 0 ? 1 : 6 * layer;

        if (layer === 0) {
            // Center enemy
            enemies.push(new Enemy(centerX, centerY, 3, level >= 3 ? bossVariants[0] : null));
        } else {
            for (let i = 0; i < enemiesInLayer; i++) {
                const angle = (Math.PI * 2 * i) / enemiesInLayer;
                let x = centerX + Math.cos(angle) * radius;
                let y = centerY + Math.sin(angle) * radius * 0.5;

                // Clamp positions to safe zone
                x = Math.max(60, Math.min(canvas.width - 60, x));
                y = Math.max(60, Math.min(320, y));

                const type = layer === 1 ? 3 : (i % 2 === 0 ? 1 : 2);
                let variant = null;

                if (type === 3 && level >= 3) {
                    variant = bossVariants[i % 4];
                }

                enemies.push(new Enemy(x, y, type, variant));
            }
        }
    }
}

// Disparar
function shoot() {
    if (!gameOver && bullets.length < 2) {
        bullets.push(new Bullet(player.x + player.width / 2 - 2, player.y));
    }
}

// Dibujar jugador
function drawPlayer() {
    if (images.player.complete) {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.rotate(Math.PI / 2); // Rotate 90 degrees clockwise (nose pointing up)
        ctx.drawImage(
            images.player,
            -player.width / 2,
            -player.height / 2,
            player.width,
            player.height
        );
        ctx.restore();
    }
}

// Mover enemigos
function moveEnemies() {
    let changeDirection = false;

    // Solo verificar enemigos en formación para cambio de dirección
    for (let enemy of enemies) {
        if (enemy.alive && enemy.state === 'formation') {
            if (enemy.x <= 50 || enemy.x >= canvas.width - 50) {
                changeDirection = true;
                break;
            }
        }
    }

    if (changeDirection) {
        for (let enemy of enemies) {
            if (enemy.alive) {
                if (enemy.state === 'formation') {
                    enemy.speedX *= -1;
                    enemy.y += 10; // Reducido de 20 a 10 para descenso más lento
                    enemy.formationX = enemy.x;
                    enemy.formationY = enemy.y;
                } else {
                    // Actualizar posición de formación incluso si está fuera
                    enemy.speedX *= -1;
                    enemy.formationX += enemy.speedX * 2; // Compensar el movimiento
                    enemy.formationY += 10;
                }
            }
        }
    }
}

// Detectar colisiones
function checkCollisions() {
    // Balas del jugador vs enemigos
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (enemy.alive &&
                bullet.x < enemy.x + enemy.width / 2 &&
                bullet.x + bullet.width > enemy.x - enemy.width / 2 &&
                bullet.y < enemy.y + enemy.height / 2 &&
                bullet.y + bullet.height > enemy.y - enemy.height / 2) {

                enemy.alive = false;
                bullets.splice(i, 1);
                score += enemy.points; // Usar la propiedad points del enemigo

                // Crear explosión
                explosions.push(new Explosion(enemy.x, enemy.y, 'enemy'));
                break;
            }
        }
    }

    // Balas enemigas vs jugador
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            
            enemyBullets.splice(i, 1);
            lives--;
            
            // Explosión del jugador
            explosions.push(new Explosion(player.x + player.width / 2, player.y + player.height / 2, 'player'));
            
            if (lives <= 0) {
                gameOver = true;
                gameState = 'gameover';
                document.getElementById('gameOverText').textContent = '¡GAME OVER! Presiona R para volver al menú';
            }
        }
    }

    // Verificar si todos los enemigos están muertos
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length === 0 && !levelingUp) {
        levelingUp = true;
        level++;
        updateUI();
        setTimeout(() => {
            createEnemies();
            levelingUp = false;
        }, 1000);
    }
}

// Actualizar interfaz
function updateUI() {
    document.getElementById('score').textContent = score.toString().padStart(5, '0');
    document.getElementById('level').textContent = level;
    document.getElementById('highScoreGame').textContent = highScoreValue.toString().padStart(5, '0');

    // Update lives display with ship icons
    const livesDisplay = document.getElementById('livesDisplay');
    livesDisplay.innerHTML = '';
    for (let i = 0; i < lives - 1; i++) { // Show lives - 1 (current ship not counted)
        const lifeIcon = document.createElement('div');
        lifeIcon.className = 'life-icon';
        livesDisplay.appendChild(lifeIcon);
    }
}

// Actualizar juego
function update() {
    if (gameOver) return;

    // Update starfield
    updateStarfield();

    // Mover jugador
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    // Actualizar balas
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }

    // Actualizar balas enemigas
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (bullet.aimed) {
            bullet.x += bullet.speedX;
            bullet.y += bullet.speedY;
        } else {
            bullet.y += bullet.speedY;
        }
        if (bullet.y > canvas.height || bullet.x < 0 || bullet.x > canvas.width) {
            enemyBullets.splice(i, 1);
        }
    }

    // Actualizar enemigos
    for (let enemy of enemies) {
        if (enemy.alive) {
            enemy.update();
        }
    }

    // Actualizar explosiones
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].update();
        if (explosions[i].finished) {
            explosions.splice(i, 1);
        }
    }

    // Mover fondo
    backgroundOffset += 0.5;
    if (backgroundOffset >= canvas.height) {
        backgroundOffset = 0;
    }

    moveEnemies();
    checkCollisions();
    updateUI();
}

// Dibujar todo
function draw() {
    // Clear canvas with black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw animated starfield
    drawStarfield();

    // Dibujar jugador
    drawPlayer();

    // Dibujar balas
    for (let bullet of bullets) {
        bullet.draw();
    }

    // Dibujar balas enemigas
    for (let bullet of enemyBullets) {
        ctx.fillStyle = bullet.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    }

    // Dibujar enemigos
    for (let enemy of enemies) {
        if (enemy.alive) {
            enemy.draw();
        }
    }

    // Dibujar explosiones
    for (let explosion of explosions) {
        explosion.draw();
    }
}

// Loop principal
function gameLoop() {
    if (!gameStarted || gameState !== 'playing') return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Reiniciar juego
function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    gameOver = false;
    gameState = 'menu';
    bullets = [];
    enemyBullets = [];
    explosions = [];
    backgroundOffset = 0;
    player.x = canvas.width / 2 - 30;
    player.y = canvas.height - 100;
    document.getElementById('gameOverText').textContent = '';
    createEnemies();
    showMenu();
}

// Iniciar juego cuando las imágenes estén cargadas (desde el menu)
function initGame() {
    gameStarted = true;
    gameState = 'playing';
    createStarfield();
    createEnemies();
    updateUI();
    gameLoop();
}