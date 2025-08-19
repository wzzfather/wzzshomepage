const { createApp } = Vue;

createApp({
    data() {
        return {
            activeSection: 'home',
            currentTime: '00:00',
            uptime: 0,
            
            // 飞船鼠标相关数据
            mouseX: 0,
            mouseY: 0,
            prevMouseX: 0,
            prevMouseY: 0,
            velocity: { x: 0, y: 0 },
            currentAngle: 0,
            targetAngle: 0,
            spaceshipRotation: { transform: 'rotate(0deg)' },
            spaceshipClasses: [],
            isAccelerating: false,
            animationFrame: null,
            lastUpdateTime: 0,
            
            // 博客统计 - 自动计算
            blogStats: {
                count: 0  // 将在mounted中自动计算
            },
            
            // 游戏统计 - 自动计算
            gameStats: {
                count: 0  // 将在mounted中自动计算
            },
            
            // 博客笔记数据 - 按文件夹分页
            blogCategories: [
                {
                    id: 'git',
                    title: 'Git版本管理',
                    icon: 'fas fa-code-branch',
                    description: '版本控制系统学习笔记',
                    notes: [
                        {
                            id: 1,
                            title: 'Git 版本管理完整指南',
                            description: '从基础操作到分支管理，全面掌握Git版本控制系统的使用方法和最佳实践。',
                            icon: 'fas fa-code-branch',
                            date: '2024-01',
                            tags: ['Git', '版本控制', '协作开发'],
                            path: '笔记/git版本管理/git操作笔记.html'
                        }
                    ]
                },
                {
                    id: 'linux',
                    title: 'Linux系统使用心得',
                    icon: 'fab fa-linux',
                    description: 'Linux系统管理和工具使用经验',
                    notes: [
                        {
                            id: 2,
                            title: 'Linux 分区挂载实战',
                            description: '详细记录Linux系统中新建分区和自动挂载的完整流程，包含btrfs和ntfs文件系统。',
                            icon: 'fas fa-hdd',
                            date: '2024-01',
                            tags: ['Linux', '分区', '挂载', 'btrfs'],
                            path: '笔记/linux系统使用心得/linux系统挂载新分区笔记.html'
                        },
                        {
                            id: 3,
                            title: 'Nano 编辑器使用技巧',
                            description: '掌握Nano文本编辑器的常用操作和快捷键，提高命令行文本编辑效率。',
                            icon: 'fas fa-terminal',
                            date: '2024-01',
                            tags: ['Nano', '编辑器', '命令行'],
                            path: '笔记/linux系统使用心得/nano常用操作.html'
                        }
                    ]
                }
            ],
            
            // 当前选中的笔记分类
            selectedCategory: null,
            
            // 游戏数据
            games: [
                {
                    id: 1,
                    title: '猴子爬树吃椰子',
                    description: '帮助可爱的猴子收集椰子，挑战更高关卡！考验你的时机把握和策略规划能力。',
                    category: '动作游戏',
                    icon: 'fas fa-tree',
                    difficulty: '简单',
                    features: ['关卡挑战', '时间限制', '技巧操作'],
                    path: '小游戏/猴子上树/index.html'
                },
                {
                    id: 2,
                    title: '选择困难症福音',
                    description: '随机选择工具合集，包含投骰子、幸运转盘、抛硬币等多种随机决策工具，帮你解决选择困难症。',
                    category: '工具合集',
                    icon: 'fas fa-dice',
                    difficulty: '简单',
                    features: ['投骰子', '幸运转盘', '抛硬币', '随机决策'],
                    path: '小游戏/选择困难症福音/index.html'
                }
            ]
        };
    },
    
    mounted() {
        this.updateTime();
        this.startUptime();
        this.generateParticles();
        this.initSpaceshipCursor();
        this.forceHideCursor();
        this.calculateStats(); // 自动计算统计数据
        
        // 每秒更新时间
        setInterval(this.updateTime, 1000);
        // 使用独立的uptime计数器，避免触发Vue响应式更新
        this.startUptimeCounter();
    },
    
    methods: {
        // 设置活动区域
        setActiveSection(section) {
            this.activeSection = section;
        },
        
        // 更新当前时间
        updateTime() {
            const now = new Date();
            this.currentTime = now.toLocaleTimeString('zh-CN', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        },
        
        // 开始运行时间计时
        startUptime() {
            this.uptime = 0;
        },
        
        // 独立的uptime计数器，避免频繁触发Vue更新
        startUptimeCounter() {
            let internalUptime = 0;
            setInterval(() => {
                internalUptime++;  // 每秒真实计数
                // 每10秒才更新Vue显示，避免频繁重渲染
                if (internalUptime % 10 === 0) {
                    this.uptime = internalUptime;
                }
            }, 1000);
        },
        
        // 格式化运行时间
        formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            if (hours > 0) {
                return `${hours}小时${minutes}分钟`;
            } else if (minutes > 0) {
                return `${minutes}分钟${secs}秒`;
            } else {
                return `${secs}秒`;
            }
        },
        
        // 生成粒子样式
        getParticleStyle() {
            return {
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 20 + 's', // 更大的延迟分布
                animationDuration: (45 + Math.random() * 30) + 's' // 45-75秒的极慢速动画
            };
        },
        
        // 生成粒子 - 静态创建避免Vue重新渲染影响
        generateParticles() {
            const container = document.getElementById('staticParticles');
            if (!container) return;
            
            // 创建50个背景粒子
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                
                // 设置随机位置和动画参数
                const style = this.getParticleStyle();
                Object.assign(particle.style, {
                    left: style.left,
                    animationDelay: style.animationDelay,
                    animationDuration: style.animationDuration
                });
                
                container.appendChild(particle);
            }
        },
        
        // 选择笔记分类
        selectCategory(category) {
            this.selectedCategory = category;
        },
        
        // 返回分类列表
        backToCategories() {
            this.selectedCategory = null;
        },
        
        // 自动计算统计数据
        calculateStats() {
            // 自动遍历所有分类，计算笔记总数
            this.blogStats.count = this.blogCategories.reduce((total, category) => {
                return total + category.notes.length;
            }, 0);
            
            // 自动计算游戏数量
            this.gameStats.count = this.games.length;
        },
        
        // 打开笔记
        openNote(note) {
            // 在新窗口中打开笔记
            window.open(note.path, '_blank');
        },
        
        // 打开游戏
        openGame(game) {
            // 在新窗口中打开游戏
            window.open(game.path, '_blank');
        },
        
        // 初始化飞船鼠标
        initSpaceshipCursor() {
            // 鼠标移动事件 - 使用节流优化性能
            document.addEventListener('mousemove', (e) => {
                const now = performance.now();
                
                // 节流：限制更新频率到60fps
                if (now - this.lastUpdateTime < 16) return;
                this.lastUpdateTime = now;
                
                this.prevMouseX = this.mouseX;
                this.prevMouseY = this.mouseY;
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                
                this.updateSpaceshipPosition();
                this.calculateTargetAngle();
                this.checkAcceleration();
                this.createIonParticles();
            });
            
            // 鼠标点击时加速效果
            document.addEventListener('mousedown', () => {
                this.triggerAcceleration();
            });
            
            // 启动平滑旋转动画循环
            this.startRotationAnimation();
        },
        
        // 更新飞船位置
        updateSpaceshipPosition() {
            if (this.$refs.spaceshipCursor) {
                // 将鼠标焦点精确定位到火箭尖端
                // 由于火箭图标被修正了-45度，需要重新计算尖端位置
                const tipDistance = 30; // 修正后的火箭图标尖端距离
                
                // 根据当前角度计算尖端的实际位置偏移
                // 火箭图标本身有-45度修正，所以实际角度需要考虑这个偏移
                const angle = this.currentAngle * (Math.PI / 180);
                const tipOffsetX = Math.sin(angle) * tipDistance;
                const tipOffsetY = -Math.cos(angle) * tipDistance;
                
                // 飞船容器的位置 = 鼠标位置 - 容器中心偏移 - 尖端偏移
                const offsetX = this.mouseX - 75 - tipOffsetX;
                const offsetY = this.mouseY - 75 - tipOffsetY;
                
                this.$refs.spaceshipCursor.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            }
        },
        
        // 计算目标角度
        calculateTargetAngle() {
            const deltaX = this.mouseX - this.prevMouseX;
            const deltaY = this.mouseY - this.prevMouseY;
            const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // 只有在有明显移动时才更新角度，避免微小抖动
            if (speed > 0.3) {
                // 计算目标角度 (0度指向上方)
                this.targetAngle = Math.atan2(deltaX, -deltaY) * (180 / Math.PI);
            }
        },
        
        // 启动平滑旋转动画
        startRotationAnimation() {
            const animate = () => {
                // 角度差值计算
                let angleDiff = this.targetAngle - this.currentAngle;
                
                // 处理角度跨越360度的情况
                if (angleDiff > 180) {
                    angleDiff -= 360;
                } else if (angleDiff < -180) {
                    angleDiff += 360;
                }
                
                // 平滑插值，调整插值速度让转弯更流畅
                const lerpSpeed = 0.25; // 进一步增加插值速度
                this.currentAngle += angleDiff * lerpSpeed;
                
                // 保持角度在0-360范围内
                if (this.currentAngle >= 360) {
                    this.currentAngle -= 360;
                } else if (this.currentAngle < 0) {
                    this.currentAngle += 360;
                }
                
                // 更新飞船旋转
                this.spaceshipRotation = {
                    transform: `rotate(${this.currentAngle}deg)`
                };
                
                // 继续动画循环
                this.animationFrame = requestAnimationFrame(animate);
            };
            
            animate();
        },
        
        // 检查加速度
        checkAcceleration() {
            const deltaX = this.mouseX - this.prevMouseX;
            const deltaY = this.mouseY - this.prevMouseY;
            const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // 更新速度类
            this.spaceshipClasses = [];
            if (speed > 10) {
                this.spaceshipClasses.push('spaceship-fast');
            }
            if (speed > 20) {
                this.spaceshipClasses.push('spaceship-accelerating');
            }
        },
        
        // 触发加速效果
        triggerAcceleration() {
            this.spaceshipClasses.push('spaceship-accelerating');
            setTimeout(() => {
                this.spaceshipClasses = this.spaceshipClasses.filter(c => c !== 'spaceship-accelerating');
            }, 300);
        },
        
        // 创建离子粒子
        createIonParticles() {
            if (!this.$refs.ionTrail) return;
            
            const deltaX = this.mouseX - this.prevMouseX;
            const deltaY = this.mouseY - this.prevMouseY;
            const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // 根据速度决定粒子数量，但限制创建频率避免影响背景粒子
            const particleCount = Math.min(Math.floor(speed / 8), 2); // 降低粒子数量和频率
            
            // 添加节流，避免过于频繁的粒子创建
            if (speed > 3) { // 只有在明显移动时才创建粒子
                for (let i = 0; i < particleCount; i++) {
                    setTimeout(() => {
                        const particle = document.createElement('div');
                        particle.className = 'ion-particle';
                        
                        // 随机偏移
                        const offsetX = (Math.random() - 0.5) * 50;
                        const offsetY = (Math.random() - 0.5) * 25;
                        
                        particle.style.left = '50%';
                        particle.style.top = '50%';
                        particle.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                        
                        this.$refs.ionTrail.appendChild(particle);
                        
                        // 移除粒子
                        setTimeout(() => {
                            if (particle.parentNode) {
                                particle.parentNode.removeChild(particle);
                            }
                        }, 500);
                    }, i * 80); // 增加间隔时间
                }
            }
        },
        
        // 强制隐藏系统鼠标
        forceHideCursor() {
            // 只添加CSS规则，不使用DOM监听器避免性能问题
            const style = document.createElement('style');
            style.textContent = `
                * { cursor: none !important; }
                body * { cursor: none !important; }
            `;
            document.head.appendChild(style);
        }
    }
}).mount('#app'); 