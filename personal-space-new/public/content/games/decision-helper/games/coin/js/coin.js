class CoinGame {
    constructor() {
        this.coinsContainer = document.getElementById('coinsContainer');
        this.flipBtn = document.getElementById('flipBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.coinCountInput = document.getElementById('coinCount');
        this.flipCountInput = document.getElementById('flipCount');
        this.currentResult = document.getElementById('currentResult');
        
        // 统计元素
        this.totalFlipsElement = document.getElementById('totalFlips');
        this.headsCountElement = document.getElementById('headsCount');
        this.tailsCountElement = document.getElementById('tailsCount');
        this.headsPercentageElement = document.getElementById('headsPercentage');
        this.tailsPercentageElement = document.getElementById('tailsPercentage');
        
        // 当前结果元素
        this.currentHeadsElement = document.getElementById('currentHeads');
        this.currentTailsElement = document.getElementById('currentTails');
        this.resultDetailsElement = document.getElementById('resultDetails');
        
        // 统计数据
        this.totalHeads = 0;
        this.totalTails = 0;
        this.totalFlips = 0;
        
        this.isFlipping = false;
        
        this.initializeEventListeners();
        this.generateCoins();
        this.updateStatistics();
    }
    
    initializeEventListeners() {
        this.flipBtn.addEventListener('click', () => this.flipCoins());
        this.resetBtn.addEventListener('click', () => this.resetStatistics());
        this.coinCountInput.addEventListener('change', () => this.generateCoins());
        
        // 键盘支持
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !this.isFlipping) {
                event.preventDefault();
                this.flipCoins();
            } else if (event.key === 'r' || event.key === 'R') {
                this.resetStatistics();
            }
        });
    }
    
    generateCoins() {
        const coinCount = parseInt(this.coinCountInput.value);
        this.coinsContainer.innerHTML = '';
        
        for (let i = 0; i < coinCount; i++) {
            const coin = document.createElement('div');
            coin.className = 'coin';
            coin.textContent = '?';
            this.coinsContainer.appendChild(coin);
        }
        
        // 隐藏当前结果
        this.currentResult.classList.add('hidden');
    }
    
    async flipCoins() {
        if (this.isFlipping) return;
        
        const coinElements = this.coinsContainer.querySelectorAll('.coin');
        const flipCount = parseInt(this.flipCountInput.value);
        
        if (coinElements.length === 0) return;
        
        this.isFlipping = true;
        this.flipBtn.disabled = true;
        this.flipBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 抛投中...';
        this.currentResult.classList.add('hidden');
        
        let sessionHeads = 0;
        let sessionTails = 0;
        let sessionResults = [];
        
        // 执行多次抛投
        for (let round = 0; round < flipCount; round++) {
            const roundResults = await this.performSingleFlip(coinElements);
            
            // 统计本轮结果
            roundResults.forEach(result => {
                if (result === 'heads') {
                    sessionHeads++;
                    this.totalHeads++;
                } else {
                    sessionTails++;
                    this.totalTails++;
                }
                sessionResults.push(result);
            });
            
            this.totalFlips += coinElements.length;
            
            // 如果不是最后一轮，稍作停顿
            if (round < flipCount - 1) {
                await this.delay(300);
            }
        }
        
        // 显示最终结果
        this.displayResults(sessionHeads, sessionTails, sessionResults);
        this.updateStatistics();
        
        this.isFlipping = false;
        this.flipBtn.disabled = false;
        this.flipBtn.innerHTML = '<i class="fas fa-hand-paper"></i> 抛掷硬币';
    }
    
    async performSingleFlip(coinElements) {
        const results = [];
        
        // 添加翻转动画
        coinElements.forEach(coin => {
            coin.classList.add('flipping');
            coin.textContent = '?';
        });
        
        // 模拟翻转过程
        const flipDuration = 1000;
        const intervalTime = 100;
        let currentTime = 0;
        
        const flipInterval = setInterval(() => {
            coinElements.forEach(coin => {
                coin.textContent = Math.random() < 0.5 ? '正' : '反';
            });
            
            currentTime += intervalTime;
            
            if (currentTime >= flipDuration) {
                clearInterval(flipInterval);
            }
        }, intervalTime);
        
        // 等待动画完成
        await this.delay(flipDuration);
        
        // 生成最终结果
        coinElements.forEach(coin => {
            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            results.push(result);
            
            coin.classList.remove('flipping');
            coin.className = `coin ${result}`;
            coin.textContent = result === 'heads' ? '正' : '反';
        });
        
        return results;
    }
    
    displayResults(headsCount, tailsCount, allResults) {
        // 更新当前结果统计
        this.currentHeadsElement.textContent = headsCount;
        this.currentTailsElement.textContent = tailsCount;
        
        // 显示详细结果
        this.resultDetailsElement.innerHTML = '';
        allResults.forEach(result => {
            const resultCoin = document.createElement('div');
            resultCoin.className = `result-coin ${result}`;
            resultCoin.textContent = result === 'heads' ? '正' : '反';
            this.resultDetailsElement.appendChild(resultCoin);
        });
        
        // 显示结果区域
        this.currentResult.classList.remove('hidden');
        
        // 添加结果显示动画
        this.currentResult.style.opacity = '0';
        this.currentResult.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            this.currentResult.style.transition = 'all 0.5s ease';
            this.currentResult.style.opacity = '1';
            this.currentResult.style.transform = 'translateY(0)';
        }, 100);
    }
    
    updateStatistics() {
        this.totalFlipsElement.textContent = this.totalFlips;
        this.headsCountElement.textContent = this.totalHeads;
        this.tailsCountElement.textContent = this.totalTails;
        
        if (this.totalFlips > 0) {
            const headsPercentage = ((this.totalHeads / this.totalFlips) * 100).toFixed(1);
            const tailsPercentage = ((this.totalTails / this.totalFlips) * 100).toFixed(1);
            
            this.headsPercentageElement.textContent = `${headsPercentage}%`;
            this.tailsPercentageElement.textContent = `${tailsPercentage}%`;
        } else {
            this.headsPercentageElement.textContent = '0%';
            this.tailsPercentageElement.textContent = '0%';
        }
    }
    
    resetStatistics() {
        this.totalHeads = 0;
        this.totalTails = 0;
        this.totalFlips = 0;
        
        this.updateStatistics();
        this.currentResult.classList.add('hidden');
        
        // 重置硬币显示
        const coinElements = this.coinsContainer.querySelectorAll('.coin');
        coinElements.forEach(coin => {
            coin.className = 'coin';
            coin.textContent = '?';
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new CoinGame();
}); 