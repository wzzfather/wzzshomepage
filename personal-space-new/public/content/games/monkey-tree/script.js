class MonkeyTreeGame {
    constructor() {
        this.initializeElements();
        this.initializeGameState();
        this.bindEvents();
        this.sounds = this.initializeSounds();
    }

    initializeElements() {
        // 屏幕元素
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.levelCompleteScreen = document.getElementById('levelCompleteScreen');

        // 游戏区域
        this.gameArea = document.getElementById('gameArea');

        // UI元素
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.timeElement = document.getElementById('time');
        this.powerFill = document.getElementById('powerFill');

        // 按钮
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.resumeButton = document.getElementById('resumeButton');
        this.restartButton = document.getElementById('restartButton');
        this.nextLevelButton = document.getElementById('nextLevelButton');
        this.playAgainButton = document.getElementById('playAgainButton');
        this.debugButton = document.getElementById('debugButton');

        // 调试元素
        this.debugInfo = document.getElementById('debugInfo');
        this.debugGameState = document.getElementById('debugGameState');
        this.debugCharging = document.getElementById('debugCharging');
        this.debugPower = document.getElementById('debugPower');
        this.debugJumping = document.getElementById('debugJumping');
        this.debugPunishment = document.getElementById('debugPunishment');

        // 暂停和结束屏幕的得分显示
        this.pauseScore = document.getElementById('pauseScore');
        this.finalScore = document.getElementById('finalScore');
        this.finalLevel = document.getElementById('finalLevel');
        this.levelScore = document.getElementById('levelScore');
    }

    initializeGameState() {
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            score: 0,
            level: 1,
            time: 60,
            maxTime: 60,
            trees: [],
            coconuts: [],
            monkey: null,
            selectedTreeIndex: 0,
            power: 0,
            isCharging: false,
            isJumping: false,
            isStunned: false,
            stunEndTime: 0
        };

        this.gameSettings = {
            initialTime: 60,
            timeBonus: 5,
            coconutScore: 10,
            minTreeHeight: 200,
            maxTreeHeight: 400,
            treeWidth: 40,
            coconutsPerTree: { min: 3, max: 5 },
            powerChargeSpeed: 2,
            maxPower: 100,
            jumpHeightMultiplier: 8 //跳跃高度连乘
        };

        this.timers = {
            gameTimer: null,
            powerTimer: null
        };
    }

    initializeSounds() {
        return {
            jump: document.getElementById('jumpSound'),
            collect: document.getElementById('collectSound'),
            levelUp: document.getElementById('levelUpSound'),
            gameOver: document.getElementById('gameOverSound')
        };
    }

    bindEvents() {
        // 按钮事件
        this.startButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.pauseGame());
        this.resumeButton.addEventListener('click', () => this.resumeGame());
        this.restartButton.addEventListener('click', () => this.restartGame());
        this.nextLevelButton.addEventListener('click', () => this.nextLevel());
        this.playAgainButton.addEventListener('click', () => this.restartGame());
        this.debugButton.addEventListener('click', () => this.toggleDebug());

        // 游戏控制事件 - 改进蓄力逻辑
        let mouseDownTime = 0;
        let mouseDownTarget = null;
        let longPressTimer = null;
        let isLongPress = false;
        
        this.gameArea.addEventListener('mousedown', (e) => {
            mouseDownTime = Date.now();
            mouseDownTarget = e.target;
            isLongPress = false;
            
            // 设置长按检测定时器
            longPressTimer = setTimeout(() => {
                // 如果鼠标还在按下状态，开始蓄力
                isLongPress = true;
                console.log('长按检测到，开始蓄力');
                this.startCharging(e);
            }, 150);
        });
        
        this.gameArea.addEventListener('mouseup', (e) => {
            const holdTime = Date.now() - mouseDownTime;
            
            // 清除长按定时器
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            if (holdTime < 150 && !isLongPress) {
                // 短按 - 处理树木切换
                const treeElement = mouseDownTarget.closest('.tree');
                if (treeElement) {
                    // 找到树的索引
                    for (let i = 0; i < this.gameState.trees.length; i++) {
                        if (this.gameState.trees[i].element === treeElement) {
                            console.log(`短按切换到树 ${i}`);
                            this.selectTree(i);
                            return;
                        }
                    }
                }
                console.log('短按空白区域，无操作');
            } else if (isLongPress) {
                // 长按 - 执行跳跃
                console.log('长按结束，执行跳跃');
                this.jump(e);
            }
        });
        
        this.gameArea.addEventListener('mouseleave', (e) => this.jump(e));

        // 触屏支持 - 与鼠标事件保持一致
        let touchStartTime = 0;
        let touchStartTarget = null;
        let touchLongPressTimer = null;
        let isTouchLongPress = false;
        
        this.gameArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartTime = Date.now();
            touchStartTarget = e.target;
            isTouchLongPress = false;
            
            // 设置长按检测定时器
            touchLongPressTimer = setTimeout(() => {
                // 如果触摸还在进行状态，开始蓄力
                isTouchLongPress = true;
                console.log('长按检测到（触屏），开始蓄力');
                this.startCharging(e);
            }, 150);
        });
        
        this.gameArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            const holdTime = Date.now() - touchStartTime;
            
            // 清除长按定时器
            if (touchLongPressTimer) {
                clearTimeout(touchLongPressTimer);
                touchLongPressTimer = null;
            }
            
            if (holdTime < 150 && !isTouchLongPress) {
                // 短按 - 处理树木切换
                const treeElement = touchStartTarget.closest('.tree');
                if (treeElement) {
                    // 找到树的索引
                    for (let i = 0; i < this.gameState.trees.length; i++) {
                        if (this.gameState.trees[i].element === treeElement) {
                            console.log(`短按切换到树 ${i}（触屏）`);
                            this.selectTree(i);
                            return;
                        }
                    }
                }
                console.log('短按空白区域（触屏），无操作');
            } else if (isTouchLongPress) {
                // 长按 - 执行跳跃
                console.log('长按结束（触屏），执行跳跃');
                this.jump(e);
            }
        });

        // 树木选择事件将在创建树木时动态绑定

        // 键盘支持
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState.isPlaying && !this.gameState.isPaused) {
                e.preventDefault();
                console.log('空格键按下');
                if (!this.gameState.isCharging && !this.gameState.isJumping) {
                    console.log('通过空格键开始蓄力');
                    this.startCharging();
                }
            }
            if (e.key === 'Escape' && this.gameState.isPlaying) {
                this.pauseGame();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.gameState.isCharging) {
                e.preventDefault();
                console.log('空格键释放，执行跳跃');
                this.jump();
            }
        });
    }

    startGame() {
        this.hideAllScreens();
        this.gameScreen.style.display = 'flex';
        
        this.resetGameState();
        this.generateLevel();
        this.startGameTimer();
        
        this.gameState.isPlaying = true;
        this.updateUI();
    }

    resetGameState() {
        this.gameState.score = 0;
        this.gameState.level = 1;
        this.gameState.time = this.gameSettings.initialTime;
        this.gameState.maxTime = this.gameSettings.initialTime;
        this.gameState.isPaused = false;
        this.gameState.power = 0;
        this.gameState.isCharging = false;
        this.gameState.isJumping = false;
        this.gameState.selectedTreeIndex = 0;
    }

    generateLevel() {
        this.clearGameArea();
        
        // 计算当前关卡的树木数量（每3关增加1棵树，最少2棵）
        const treeCount = Math.floor((this.gameState.level - 1) / 3) + 2;
        
        this.gameState.trees = [];
        this.gameState.coconuts = [];

        const gameAreaWidth = this.gameArea.clientWidth;
        const treeSpacing = gameAreaWidth / (treeCount + 1);

        // 生成树木
        for (let i = 0; i < treeCount; i++) {
            const tree = this.createTree(i, treeSpacing * (i + 1));
            this.gameState.trees.push(tree);
        }

        // 创建猴子并放在第一棵树上
        this.createMonkey();
        
        // 确保有树木后再选择第一棵树
        if (this.gameState.trees.length > 0) {
            console.log(`关卡生成完成，共${this.gameState.trees.length}棵树`);
            setTimeout(() => {
                this.selectTree(0);
            }, 100); // 延迟一点确保DOM元素完全创建
        }
    }

    createTree(index, x) {
        const height = Math.random() * 
            (this.gameSettings.maxTreeHeight - this.gameSettings.minTreeHeight) + 
            this.gameSettings.minTreeHeight;

        const treeElement = document.createElement('div');
        treeElement.className = 'tree';
        treeElement.style.left = `${x - this.gameSettings.treeWidth / 2}px`;

        const trunk = document.createElement('div');
        trunk.className = 'tree-trunk';
        trunk.style.width = `${this.gameSettings.treeWidth}px`;
        trunk.style.height = `${height}px`;

        const leaves = document.createElement('div');
        leaves.className = 'tree-leaves';

        treeElement.appendChild(trunk);
        treeElement.appendChild(leaves);

        // 树木点击事件现在由gameArea统一处理，这里不再需要单独的事件监听器

        this.gameArea.appendChild(treeElement);

        // 添加调试中心线（可选，用于验证对齐）
        if (window.debugAlignment) {
            const centerLine = document.createElement('div');
            centerLine.style.position = 'absolute';
            centerLine.style.left = `${x}px`;
            centerLine.style.top = '0';
            centerLine.style.bottom = '0';
            centerLine.style.width = '2px';
            centerLine.style.background = 'red';
            centerLine.style.zIndex = '999';
            centerLine.style.opacity = '0.5';
            this.gameArea.appendChild(centerLine);
        }

        // 生成椰子
        const coconutCount = Math.floor(Math.random() * 
            (this.gameSettings.coconutsPerTree.max - this.gameSettings.coconutsPerTree.min + 1)) + 
            this.gameSettings.coconutsPerTree.min;

        const coconuts = [];
        for (let i = 0; i < coconutCount; i++) {
            const coconutHeight = (height / (coconutCount + 1)) * (i + 1) + 
                (Math.random() - 0.5) * 30; // 减少随机性，确保椰子位置合理
            const coconut = this.createCoconut(x, Math.max(20, coconutHeight), index, i);
            coconuts.push(coconut);
            console.log(`创建椰子: 树${index}, 椰子${i}, 位置(${x}, ${coconutHeight.toFixed(1)})`);
        }

        return {
            element: treeElement,
            x: x,
            height: height,
            coconuts: coconuts,
            index: index
        };
    }

    createCoconut(x, height, treeIndex, coconutIndex) {
        const coconutElement = document.createElement('div');
        coconutElement.className = 'coconut';
        // 椰子居中对齐到树干中心（椰子宽度20px，所以偏移10px）
        coconutElement.style.left = `${x - 10}px`;
        coconutElement.style.bottom = `${height}px`;
        console.log(`椰子位置设置: 树中心x=${x}, 椰子left=${x - 10}, 椰子实际中心=${x}`);
        coconutElement.dataset.treeIndex = treeIndex;
        coconutElement.dataset.coconutIndex = coconutIndex;

        // 移除直接点击收集椰子的功能，只能通过猴子跳跃收集
        // coconutElement.addEventListener('click', (e) => {
        //     e.stopPropagation();
        //     this.collectCoconut(coconutElement, treeIndex, coconutIndex);
        // });

        this.gameArea.appendChild(coconutElement);

        const coconut = {
            element: coconutElement,
            x: x,
            height: height,
            collected: false,
            treeIndex: treeIndex,
            coconutIndex: coconutIndex
        };

        this.gameState.coconuts.push(coconut);
        return coconut;
    }

    createMonkey() {
        if (this.gameState.monkey) {
            this.gameState.monkey.element.remove();
        }

        const monkeyElement = document.createElement('div');
        monkeyElement.className = 'monkey';
        monkeyElement.id = 'monkey';

        this.gameArea.appendChild(monkeyElement);

        this.gameState.monkey = {
            element: monkeyElement,
            x: 0,
            y: 0,
            currentTreeIndex: 0
        };
    }

    selectTree(index) {
        if (index < 0 || index >= this.gameState.trees.length) {
            console.log(`无效的树索引: ${index}`);
            return;
        }

        console.log(`切换到树 ${index}，当前树 ${this.gameState.selectedTreeIndex}`);

        // 移除之前选中树的高亮
        this.gameState.trees.forEach((tree, i) => {
            tree.element.classList.remove('selected');
            console.log(`移除树 ${i} 的选中状态`);
        });

        // 高亮新选中的树
        this.gameState.trees[index].element.classList.add('selected');
        this.gameState.selectedTreeIndex = index;
        console.log(`设置树 ${index} 为选中状态`);

        // 移动猴子到新树的底部（地面位置）
        const selectedTree = this.gameState.trees[index];
        this.gameState.monkey.x = selectedTree.x;
        this.gameState.monkey.y = 0; // 确保猴子在地面
        this.gameState.monkey.currentTreeIndex = index;

        console.log(`猴子移动到位置: x=${selectedTree.x}, y=0（地面）, 树高=${selectedTree.height}`);
        this.updateMonkeyPosition();
    }

    updateMonkeyPosition() {
        const monkey = this.gameState.monkey;
        // 猴子居中对齐到树干中心（猴子宽度40px，所以偏移20px）
        monkey.element.style.left = `${monkey.x - 20}px`;
        monkey.element.style.bottom = `${monkey.y}px`;
        
        // 调试信息：显示猴子当前位置
        if (this.gameState.isJumping && monkey.y > 10) {
            console.log(`猴子位置更新: 树中心x=${monkey.x}, 猴子left=${monkey.x - 20}, 位置(${monkey.x}, ${monkey.y})`);
        }
    }

    startCharging(event) {
        console.log(`尝试开始蓄力: isPlaying=${this.gameState.isPlaying}, isPaused=${this.gameState.isPaused}, isJumping=${this.gameState.isJumping}, isCharging=${this.gameState.isCharging}, isStunned=${this.gameState.isStunned}`);
        
        if (!this.gameState.isPlaying || this.gameState.isPaused || 
            this.gameState.isJumping || this.gameState.isCharging || this.gameState.isStunned) {
            console.log('蓄力被阻止，原因：游戏状态不允许');
            return;
        }

        console.log('✅ 开始蓄力！');
        this.gameState.isCharging = true;
        this.gameState.power = 0;
        
        // 添加视觉反馈
        this.gameArea.classList.add('charging');

        this.timers.powerTimer = setInterval(() => {
            if (this.gameState.power < this.gameSettings.maxPower) {
                this.gameState.power += this.gameSettings.powerChargeSpeed;
                this.updatePowerBar();
            }
        }, 50);
    }

    jump(event) {
        console.log(`尝试跳跃: isCharging=${this.gameState.isCharging}, power=${this.gameState.power}`);
        
        if (!this.gameState.isCharging) {
            console.log('跳跃被阻止：没有在蓄力状态');
            return;
        }

        console.log('⬆️ 执行跳跃！');
        this.gameState.isCharging = false;
        clearInterval(this.timers.powerTimer);
        
        // 移除视觉反馈
        this.gameArea.classList.remove('charging');

        if (this.gameState.power === 0) {
            console.log('跳跃取消：蓄力为0');
            this.updatePowerBar();
            return;
        }

        this.gameState.isJumping = true;
        
        // 播放跳跃音效
        this.playSound('jump');

        // 计算跳跃高度
        const jumpHeight = (this.gameState.power / this.gameSettings.maxPower) * 
            this.gameSettings.jumpHeightMultiplier * 100;

        const monkey = this.gameState.monkey;
        const currentTree = this.gameState.trees[monkey.currentTreeIndex];
        
        // 移除CSS动画，使用JavaScript控制位置
        // monkey.element.classList.add('jumping');

        // 模拟跳跃轨迹
        const startY = monkey.y;
        const maxJumpHeight = startY + jumpHeight;
        const duration = 800; // 跳跃持续时间
        const startTime = Date.now();

        // 检查是否超过安全高度
        const treeHeight = currentTree ? currentTree.height : 200;
        const safeHeight = treeHeight * 1.5; // 安全高度是树高的150%
        const willCauseDamage = maxJumpHeight > safeHeight;

        console.log(`🐒 跳跃分析:`);
        console.log(`  起始位置: ${startY} (应该是0-地面)`);
        console.log(`  跳跃力度: ${jumpHeight}`);
        console.log(`  最大高度: ${maxJumpHeight} = ${startY} + ${jumpHeight}`);
        console.log(`  当前树高: ${treeHeight}`);
        console.log(`  安全高度: ${safeHeight.toFixed(1)} = 树高 × 1.5`);
        console.log(`  是否危险: ${willCauseDamage} (最大高度 ${maxJumpHeight > safeHeight ? '>' : '≤'} 安全高度 ${safeHeight.toFixed(1)})`);

        const animateJump = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress <= 1) {
                // 使用抛物线轨迹
                const currentY = startY + jumpHeight * (1 - Math.pow(2 * progress - 1, 2));
                monkey.y = Math.max(startY, currentY);
                
                // 直接更新猴子位置，不使用CSS动画
                this.updateMonkeyPosition();

                // 检查椰子碰撞
                this.checkCoconutCollision();

                requestAnimationFrame(animateJump);
            } else {
                // 跳跃结束，猴子回到地面
                monkey.y = 0; // 强制回到地面
                this.updateMonkeyPosition();
                this.gameState.isJumping = false;
                
                // 检查是否需要施加惩罚
                if (willCauseDamage) {
                    // 计算超出安全高度的程度
                    const excessHeight = maxJumpHeight - safeHeight;
                    console.log(`惩罚计算: 最大高度${maxJumpHeight} - 安全高度${safeHeight} = 超出${excessHeight}`);
                    this.applyFallDamage(monkey.x, 0, excessHeight, treeHeight);
                }
                
                console.log(`跳跃结束，猴子回到地面。最大高度${maxJumpHeight}，安全高度${safeHeight}`);
            }
        };

        animateJump();

        // 重置蓄力条
        this.gameState.power = 0;
        this.updatePowerBar();
    }

    checkCoconutCollision() {
        const monkey = this.gameState.monkey;
        const currentTree = this.gameState.trees[monkey.currentTreeIndex];

        if (!currentTree || !this.gameState.isJumping) return;

        currentTree.coconuts.forEach(coconut => {
            if (!coconut.collected) {
                const verticalDistance = Math.abs(monkey.y - coconut.height);
                const horizontalDistance = Math.abs(monkey.x - coconut.x);
                
                // 获取DOM元素的实际位置进行对比
                const monkeyRect = monkey.element.getBoundingClientRect();
                const coconutRect = coconut.element.getBoundingClientRect();
                const gameAreaRect = this.gameArea.getBoundingClientRect();
                
                // 计算相对于游戏区域的位置
                const monkeyBottomFromGameArea = gameAreaRect.bottom - monkeyRect.bottom;
                const coconutBottomFromGameArea = gameAreaRect.bottom - coconutRect.bottom;
                
                // 调试信息
                if (verticalDistance < 50 && horizontalDistance < 50) {
                    console.log(`接近椰子:`);
                    console.log(`  猴子逻辑位置(${monkey.x}, ${monkey.y}), DOM底部距离=${monkeyBottomFromGameArea.toFixed(1)}`);
                    console.log(`  椰子逻辑位置(${coconut.x}, ${coconut.height}), DOM底部距离=${coconutBottomFromGameArea.toFixed(1)}`);
                    console.log(`  垂直距离=${verticalDistance.toFixed(1)}, 水平距离=${horizontalDistance.toFixed(1)}`);
                    console.log(`  DOM垂直距离=${Math.abs(monkeyBottomFromGameArea - coconutBottomFromGameArea).toFixed(1)}`);
                }
                
                // 使用DOM位置进行更准确的碰撞检测
                const domVerticalDistance = Math.abs(monkeyBottomFromGameArea - coconutBottomFromGameArea);
                const domHorizontalDistance = Math.abs(monkeyRect.left - coconutRect.left);
                
                if (domVerticalDistance < 30 && domHorizontalDistance < 25) {
                    console.log(`🎉 猴子收集椰子: 树${coconut.treeIndex}, 椰子${coconut.coconutIndex} (使用DOM位置检测)`);
                    this.collectCoconut(coconut.element, coconut.treeIndex, coconut.coconutIndex);
                }
            }
        });
    }

    collectCoconut(coconutElement, treeIndex, coconutIndex) {
        const coconut = this.gameState.coconuts.find(c => 
            c.treeIndex === treeIndex && c.coconutIndex === coconutIndex);
        
        if (!coconut || coconut.collected) return;

        coconut.collected = true;
        coconut.element.classList.add('collected');

        // 播放收集音效
        this.playSound('collect');

        // 更新分数
        this.gameState.score += this.gameSettings.coconutScore;

        // 显示得分动画
        this.showScorePopup(coconut.x, coconut.height + 100, `+${this.gameSettings.coconutScore}`);

        // 移除椰子元素
        setTimeout(() => {
            coconut.element.remove();
        }, 500);

        this.updateUI();

        // 检查是否完成关卡
        this.checkLevelComplete();
    }

    showScorePopup(x, y, text) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = text;
        popup.style.left = `${x - 20}px`;
        popup.style.bottom = `${y}px`;

        this.gameArea.appendChild(popup);

        setTimeout(() => {
            popup.remove();
        }, 1000);
    }

    checkLevelComplete() {
        const allCoconutsCollected = this.gameState.coconuts.every(coconut => coconut.collected);
        
        if (allCoconutsCollected) {
            this.completeLevel();
        }
    }

    completeLevel() {
        this.gameState.isPlaying = false;
        clearInterval(this.timers.gameTimer);

        // 播放升级音效
        this.playSound('levelUp');

        // 奖励时间
        this.gameState.time = Math.min(this.gameState.time + this.gameSettings.timeBonus, 
                                      this.gameState.maxTime);

        // 显示关卡完成界面
        this.levelScore.textContent = this.gameState.score;
        this.levelCompleteScreen.style.display = 'flex';
    }

    nextLevel() {
        this.gameState.level++;
        this.levelCompleteScreen.style.display = 'none';
        
        this.generateLevel();
        this.startGameTimer();
        this.gameState.isPlaying = true;
        this.updateUI();
    }

    pauseGame() {
        if (!this.gameState.isPlaying) return;

        this.gameState.isPaused = true;
        clearInterval(this.timers.gameTimer);
        clearInterval(this.timers.powerTimer);

        this.pauseScore.textContent = this.gameState.score;
        this.pauseScreen.style.display = 'flex';
    }

    resumeGame() {
        this.gameState.isPaused = false;
        this.pauseScreen.style.display = 'none';
        this.startGameTimer();
    }

    restartGame() {
        this.hideAllScreens();
        this.clearTimers();
        this.startScreen.style.display = 'flex';
        this.gameState.isPlaying = false;
    }

    gameOver() {
        this.gameState.isPlaying = false;
        this.clearTimers();

        // 播放游戏结束音效
        this.playSound('gameOver');

        // 显示最终得分
        this.finalScore.textContent = this.gameState.score;
        this.finalLevel.textContent = this.gameState.level;
        this.gameOverScreen.style.display = 'flex';
    }

    startGameTimer() {
        this.timers.gameTimer = setInterval(() => {
            this.gameState.time--;
            this.updateUI();

            if (this.gameState.time <= 0) {
                this.gameOver();
            }
        }, 1000);
    }

    updatePowerBar() {
        const powerPercentage = (this.gameState.power / this.gameSettings.maxPower) * 100;
        this.powerFill.style.width = `${powerPercentage}%`;
    }

    updateUI() {
        this.scoreElement.textContent = this.gameState.score;
        this.levelElement.textContent = this.gameState.level;
        this.timeElement.textContent = this.gameState.time;

        // 时间警告效果
        if (this.gameState.time <= 10) {
            this.timeElement.classList.add('warning');
        } else {
            this.timeElement.classList.remove('warning');
        }
    }

    clearGameArea() {
        const elements = this.gameArea.querySelectorAll('.tree, .coconut, .monkey, .score-popup, .particle');
        elements.forEach(element => element.remove());
    }

    clearTimers() {
        clearInterval(this.timers.gameTimer);
        clearInterval(this.timers.powerTimer);
    }

    hideAllScreens() {
        this.startScreen.style.display = 'none';
        this.gameScreen.style.display = 'none';
        this.pauseScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.levelCompleteScreen.style.display = 'none';
    }

    playSound(soundName) {
        try {
            if (this.sounds[soundName]) {
                this.sounds[soundName].currentTime = 0;
                this.sounds[soundName].play().catch(e => {
                    console.log('音效播放失败:', e);
                });
            }
        } catch (error) {
            console.log('音效播放错误:', error);
        }
    }

    // 跌落伤害处理
    applyFallDamage(x, y, excessHeight, treeHeight) {
        // 计算惩罚时间：基础1秒 + 超出高度比例 * 额外时间
        const excessRatio = excessHeight / treeHeight; // 超出高度与树高的比例
        const basePunishmentTime = 1000; // 基础惩罚时间1秒
        const maxExtraPunishmentTime = 3000; // 最大额外惩罚时间3秒
        
        // 惩罚时间计算：线性增长，但有上限
        const extraTime = Math.min(excessRatio * 2 * maxExtraPunishmentTime, maxExtraPunishmentTime);
        const totalPunishmentTime = basePunishmentTime + extraTime;
        
        console.log(`🤕 猴子跌落受伤！超出安全高度${excessHeight.toFixed(1)}px (${(excessRatio*100).toFixed(1)}%)`);
        console.log(`   晕眩时间: ${(totalPunishmentTime/1000).toFixed(1)}秒`);
        
        // 设置晕眩状态
        this.gameState.isStunned = true;
        this.gameState.stunEndTime = Date.now() + totalPunishmentTime;
        
        // 添加晕眩视觉效果，强度根据伤害程度调整
        const monkey = this.gameState.monkey;
        const damageIntensity = Math.min(excessRatio * 2, 1); // 伤害强度0-1
        
        // 根据伤害强度调整视觉效果
        if (damageIntensity < 0.3) {
            // 轻微伤害：浅红色，慢震动
            monkey.element.style.filter = 'sepia(50%) hue-rotate(320deg)';
            monkey.element.style.animation = 'shake 0.8s ease-in-out infinite';
        } else if (damageIntensity < 0.7) {
            // 中等伤害：中红色，正常震动
            monkey.element.style.filter = 'sepia(75%) hue-rotate(320deg)';
            monkey.element.style.animation = 'shake 0.5s ease-in-out infinite';
        } else {
            // 严重伤害：深红色，快速震动
            monkey.element.style.filter = 'sepia(100%) hue-rotate(320deg) brightness(0.8)';
            monkey.element.style.animation = 'shake 0.3s ease-in-out infinite';
        }
        
        // 创建落地特效，特效数量根据伤害程度调整
        this.createFallEffect(x, y, damageIntensity);
        
        // 恢复时间根据计算的惩罚时间
        setTimeout(() => {
            this.gameState.isStunned = false;
            monkey.element.style.filter = '';
            monkey.element.style.animation = '';
            console.log('😊 猴子恢复正常');
        }, totalPunishmentTime);
    }

    // 创建落地特效
    createFallEffect(x, y, damageIntensity = 0.5) {
        // 根据伤害强度选择特效符号和数量
        let sparkles, effectCount, effectSize, spreadRange;
        
        if (damageIntensity < 0.3) {
            // 轻微伤害：少量温和特效
            sparkles = ['✨', '💫', '⭐'];
            effectCount = 5;
            effectSize = '16px';
            spreadRange = 40;
        } else if (damageIntensity < 0.7) {
            // 中等伤害：中等特效
            sparkles = ['✨', '💫', '⭐', '🌟'];
            effectCount = 8;
            effectSize = '20px';
            spreadRange = 60;
        } else {
            // 严重伤害：大量强烈特效
            sparkles = ['💥', '💫', '🌟', '💥', '⚡', '🔥'];
            effectCount = 12;
            effectSize = '24px';
            spreadRange = 80;
        }
        
        console.log(`创建落地特效: 强度${(damageIntensity*100).toFixed(0)}%, ${effectCount}个特效`);
        
        for (let i = 0; i < effectCount; i++) {
            const effect = document.createElement('div');
            effect.className = 'fall-effect';
            effect.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            
            const offsetX = (Math.random() - 0.5) * spreadRange;
            const offsetY = Math.random() * (spreadRange * 0.5);
            
            effect.style.position = 'absolute';
            effect.style.left = `${x + offsetX}px`;
            effect.style.bottom = `${y + offsetY}px`;
            effect.style.fontSize = effectSize;
            effect.style.pointerEvents = 'none';
            effect.style.zIndex = '1000';
            
            // 根据伤害强度调整动画速度
            const animationDuration = damageIntensity > 0.7 ? '0.8s' : '1s';
            effect.style.animation = `fallEffectAnimation ${animationDuration} ease-out forwards`;
            
            this.gameArea.appendChild(effect);
            
            setTimeout(() => {
                effect.remove();
            }, damageIntensity > 0.7 ? 800 : 1000);
        }
    }

    // 添加粒子效果（可选）
    createParticleEffect(x, y, color = '#FFD700') {
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${x + (Math.random() - 0.5) * 20}px`;
            particle.style.bottom = `${y + (Math.random() - 0.5) * 20}px`;
            particle.style.background = color;
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.borderRadius = '50%';

            this.gameArea.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    // 调试功能
    toggleDebug() {
        const isVisible = this.debugInfo.style.display !== 'none';
        this.debugInfo.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // 开始调试信息更新
            this.debugTimer = setInterval(() => {
                this.updateDebugInfo();
            }, 100);
            console.log('🔍 调试模式已开启');
        } else {
            // 停止调试信息更新
            if (this.debugTimer) {
                clearInterval(this.debugTimer);
                this.debugTimer = null;
            }
            console.log('🔍 调试模式已关闭');
        }
    }

    updateDebugInfo() {
        if (!this.debugInfo || this.debugInfo.style.display === 'none') return;
        
        this.debugGameState.textContent = this.gameState.isPlaying ? '游戏中' : '未开始';
        this.debugCharging.textContent = this.gameState.isCharging ? '蓄力中' : '未蓄力';
        this.debugPower.textContent = `${this.gameState.power.toFixed(1)}/${this.gameSettings.maxPower}`;
        
        let jumpingText = this.gameState.isJumping ? '跳跃中' : '未跳跃';
        if (this.gameState.isStunned) {
            const remainingTime = Math.max(0, this.gameState.stunEndTime - Date.now());
            jumpingText += ` (晕眩${(remainingTime/1000).toFixed(1)}s)`;
        }
        this.debugJumping.textContent = jumpingText;
        
        // 更新惩罚信息
        if (this.gameState.isStunned) {
            const remainingTime = Math.max(0, this.gameState.stunEndTime - Date.now());
            const totalTime = this.gameState.stunEndTime - (Date.now() - remainingTime);
            this.debugPunishment.textContent = `晕眩中 ${(remainingTime/1000).toFixed(1)}s`;
        } else {
            this.debugPunishment.textContent = '正常';
        }
    }

    // 获取游戏统计信息
    getGameStats() {
        return {
            score: this.gameState.score,
            level: this.gameState.level,
            time: this.gameState.time,
            coconutsCollected: this.gameState.coconuts.filter(c => c.collected).length,
            totalCoconuts: this.gameState.coconuts.length
        };
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MonkeyTreeGame();
    
    // 添加全局调试功能（开发时使用）
    window.debugGame = () => {
        console.log('游戏状态:', window.game.gameState);
        console.log('游戏统计:', window.game.getGameStats());
    };
    
    // 添加对齐调试功能
    window.toggleAlignmentDebug = () => {
        window.debugAlignment = !window.debugAlignment;
        console.log('对齐调试模式:', window.debugAlignment ? '开启' : '关闭');
        if (window.game.gameState.isPlaying) {
            console.log('请重新开始游戏以看到调试线');
        }
    };
    
    // 添加安全高度测试功能
    window.testSafeHeight = () => {
        if (!window.game.gameState.isPlaying) {
            console.log('请先开始游戏');
            return;
        }
        
        const monkey = window.game.gameState.monkey;
        const currentTree = window.game.gameState.trees[monkey.currentTreeIndex];
        
        if (currentTree) {
            const treeHeight = currentTree.height;
            const safeHeight = treeHeight * 1.7;
            
            console.log('🌳 安全高度测试:');
            console.log(`  当前树高: ${treeHeight}px`);
            console.log(`  安全高度: ${safeHeight}px (树高 × 1.5)`);
            console.log(`  猴子位置: (${monkey.x}, ${monkey.y})`);
            console.log(`  测试跳跃高度:`);
            console.log(`    100px → ${100 > safeHeight ? '危险' : '安全'}`);
            console.log(`    200px → ${200 > safeHeight ? '危险' : '安全'}`);
            console.log(`    300px → ${300 > safeHeight ? '危险' : '安全'}`);
            console.log(`    400px → ${400 > safeHeight ? '危险' : '安全'}`);
        } else {
            console.log('未找到当前树');
        }
    };
}); 