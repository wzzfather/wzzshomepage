class WheelGame {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.sectionCountInput = document.getElementById('sectionCount');
        this.sectionsContainer = document.getElementById('sectionsContainer');
        this.updateBtn = document.getElementById('updateBtn');
        this.spinBtn = document.getElementById('spinBtn');
        this.spinAgainBtn = document.getElementById('spinAgainBtn');
        this.result = document.getElementById('result');
        this.resultText = document.getElementById('resultText');
        
        this.sections = [];
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
            '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
        ];
        this.currentRotation = 0;
        this.isSpinning = false;
        
        this.initializeEventListeners();
        this.generateSectionInputs();
        this.updateWheel();
    }
    
    initializeEventListeners() {
        this.sectionCountInput.addEventListener('change', () => {
            this.generateSectionInputs();
            this.updateWheel();
        });
        
        this.updateBtn.addEventListener('click', () => this.updateWheel());
        this.spinBtn.addEventListener('click', () => this.spin());
        this.spinAgainBtn.addEventListener('click', () => this.spinAgain());
        
        // 键盘支持
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !this.isSpinning) {
                event.preventDefault();
                this.spin();
            }
        });
    }
    
    generateSectionInputs() {
        const sectionCount = parseInt(this.sectionCountInput.value);
        this.sectionsContainer.innerHTML = '';
        
        // 保留现有的分区名称
        const existingSections = this.sections.slice();
        this.sections = [];
        
        for (let i = 0; i < sectionCount; i++) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'section-input';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `分区 ${i + 1}`;
            input.value = existingSections[i] || `选项${i + 1}`;
            input.addEventListener('input', () => this.updateSectionFromInput());
            
            sectionDiv.appendChild(input);
            this.sectionsContainer.appendChild(sectionDiv);
        }
        
        this.updateSectionFromInput();
    }
    
    updateSectionFromInput() {
        const inputs = this.sectionsContainer.querySelectorAll('input');
        this.sections = Array.from(inputs).map(input => input.value.trim() || input.placeholder);
    }
    
    updateWheel() {
        this.updateSectionFromInput();
        this.drawWheel();
    }
    
    drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const sectionCount = this.sections.length;
        const anglePerSection = (2 * Math.PI) / sectionCount;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制转盘分区
        for (let i = 0; i < sectionCount; i++) {
            const startAngle = i * anglePerSection + this.currentRotation;
            const endAngle = (i + 1) * anglePerSection + this.currentRotation;
            const color = this.colors[i % this.colors.length];
            
            // 绘制分区
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = color;
            this.ctx.fill();
            
            // 绘制分区边界
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制文字
            const textAngle = startAngle + anglePerSection / 2;
            const textX = centerX + Math.cos(textAngle) * (radius * 0.7);
            const textY = centerY + Math.sin(textAngle) * (radius * 0.7);
            
            this.ctx.save();
            this.ctx.translate(textX, textY);
            this.ctx.rotate(textAngle + Math.PI / 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 处理长文本
            const text = this.sections[i];
            if (text.length > 8) {
                const words = text.split('');
                const maxLength = 6;
                const displayText = words.slice(0, maxLength).join('') + (words.length > maxLength ? '...' : '');
                this.ctx.fillText(displayText, 0, 0);
            } else {
                this.ctx.fillText(text, 0, 0);
            }
            
            this.ctx.restore();
        }
        
        // 绘制中心圆
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#333';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }
    
    spin() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.spinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 转动中...';
        this.result.classList.add('hidden');
        
        // 生成随机转动角度（至少转3圈）
        const minRotation = Math.PI * 6; // 3圈
        const maxRotation = Math.PI * 10; // 5圈
        const randomRotation = minRotation + Math.random() * (maxRotation - minRotation);
        const finalRotation = this.currentRotation + randomRotation;
        
        // 动画转动
        const startTime = Date.now();
        const duration = 3000; // 3秒
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用缓动函数
            const easeOut = 1 - Math.pow(1 - progress, 3);
            this.currentRotation = this.currentRotation + randomRotation * easeOut;
            
            this.drawWheel();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.currentRotation = finalRotation;
                this.finishSpin();
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    finishSpin() {
        this.isSpinning = false;
        this.spinBtn.disabled = false;
        this.spinBtn.innerHTML = '<i class="fas fa-play"></i> 开始转动';
        
        // 计算指针指向的分区
        const sectionCount = this.sections.length;
        const anglePerSection = (2 * Math.PI) / sectionCount;
        
        // 指针指向正上方（-π/2），需要调整角度计算
        const pointerAngle = -Math.PI / 2;
        const normalizedRotation = ((this.currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const relativeAngle = ((pointerAngle - normalizedRotation) + 2 * Math.PI) % (2 * Math.PI);
        const sectionIndex = Math.floor(relativeAngle / anglePerSection);
        const resultSection = this.sections[sectionIndex];
        
        // 显示结果
        this.showResult(resultSection);
    }
    
    showResult(resultSection) {
        this.resultText.textContent = resultSection;
        this.result.classList.remove('hidden');
        
        // 添加结果显示动画
        this.result.style.opacity = '0';
        this.result.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            this.result.style.transition = 'all 0.5s ease';
            this.result.style.opacity = '1';
            this.result.style.transform = 'scale(1)';
        }, 100);
    }
    
    spinAgain() {
        this.result.classList.add('hidden');
        setTimeout(() => {
            this.spin();
        }, 300);
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new WheelGame();
}); 