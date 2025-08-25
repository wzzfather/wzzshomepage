class DiceGame {
    constructor() {
        this.diceContainer = document.getElementById('diceContainer');
        this.rollBtn = document.getElementById('rollBtn');
        this.results = document.getElementById('results');
        this.diceCountInput = document.getElementById('diceCount');
        this.targetSumInput = document.getElementById('targetSum');
        this.conditionSelect = document.getElementById('condition');
        this.successActionInput = document.getElementById('successAction');
        this.failActionInput = document.getElementById('failAction');
        
        this.initializeEventListeners();
        this.generateDice();
    }
    
    initializeEventListeners() {
        this.rollBtn.addEventListener('click', () => this.rollDice());
        this.diceCountInput.addEventListener('change', () => this.generateDice());
        
        // 键盘支持
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                this.rollDice();
            }
        });
    }
    
    generateDice() {
        const diceCount = parseInt(this.diceCountInput.value);
        this.diceContainer.innerHTML = '';
        
        for (let i = 0; i < diceCount; i++) {
            const dice = document.createElement('div');
            dice.className = 'dice';
            dice.textContent = '?';
            this.diceContainer.appendChild(dice);
        }
        
        // 隐藏结果
        this.results.classList.add('hidden');
    }
    
    rollDice() {
        const diceElements = this.diceContainer.querySelectorAll('.dice');
        const diceCount = diceElements.length;
        
        if (diceCount === 0) return;
        
        // 禁用按钮
        this.rollBtn.disabled = true;
        this.rollBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 投掷中...';
        
        // 添加滚动动画
        diceElements.forEach(dice => {
            dice.classList.add('rolling');
            dice.textContent = '?';
        });
        
        // 模拟投掷过程
        const rollDuration = 1000;
        const intervalTime = 100;
        let currentTime = 0;
        
        const rollInterval = setInterval(() => {
            diceElements.forEach(dice => {
                dice.textContent = Math.floor(Math.random() * 6) + 1;
            });
            
            currentTime += intervalTime;
            
            if (currentTime >= rollDuration) {
                clearInterval(rollInterval);
                this.finishRoll(diceElements);
            }
        }, intervalTime);
    }
    
    finishRoll(diceElements) {
        // 生成最终结果
        const results = [];
        diceElements.forEach(dice => {
            const value = Math.floor(Math.random() * 6) + 1;
            dice.textContent = value;
            dice.classList.remove('rolling');
            results.push(value);
        });
        
        // 计算总和
        const totalSum = results.reduce((sum, value) => sum + value, 0);
        
        // 判定结果
        const targetSum = parseInt(this.targetSumInput.value);
        const condition = this.conditionSelect.value;
        const isSuccess = this.evaluateCondition(totalSum, targetSum, condition);
        
        // 显示结果
        this.displayResults(results, totalSum, isSuccess);
        
        // 恢复按钮
        this.rollBtn.disabled = false;
        this.rollBtn.innerHTML = '<i class="fas fa-dice"></i> 投掷骰子';
    }
    
    evaluateCondition(totalSum, targetSum, condition) {
        switch (condition) {
            case 'equal':
                return totalSum === targetSum;
            case 'greater':
                return totalSum > targetSum;
            case 'less':
                return totalSum < targetSum;
            case 'greaterEqual':
                return totalSum >= targetSum;
            case 'lessEqual':
                return totalSum <= targetSum;
            default:
                return false;
        }
    }
    
    displayResults(results, totalSum, isSuccess) {
        // 显示各骰子点数
        document.getElementById('individualResults').textContent = results.join(', ');
        
        // 显示总和
        document.getElementById('totalSum').textContent = totalSum;
        
        // 显示判定结果
        const judgmentElement = document.getElementById('judgmentResult');
        judgmentElement.textContent = isSuccess ? '成功！' : '失败！';
        judgmentElement.className = `value judgment ${isSuccess ? 'success' : 'failure'}`;
        
        // 显示执行动作
        const actionText = isSuccess ? 
            this.successActionInput.value || '恭喜！条件达成！' : 
            this.failActionInput.value || '很遗憾，条件未达成。';
            
        document.getElementById('actionText').textContent = actionText;
        
        // 显示结果区域
        this.results.classList.remove('hidden');
        
        // 添加结果显示动画
        this.results.style.opacity = '0';
        this.results.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            this.results.style.transition = 'all 0.5s ease';
            this.results.style.opacity = '1';
            this.results.style.transform = 'translateY(0)';
        }, 100);
    }
    
    getConditionText(condition) {
        const conditionTexts = {
            'equal': '等于',
            'greater': '大于',
            'less': '小于',
            'greaterEqual': '大于等于',
            'lessEqual': '小于等于'
        };
        return conditionTexts[condition] || condition;
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new DiceGame();
}); 