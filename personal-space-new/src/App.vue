<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'

// 定义类型接口
interface Note {
  id: number
  title: string
  description: string
  icon: string
  date: string
  tags: string[]
  path: string
}

interface Category {
  id: string
  title: string
  icon: string
  description: string
  notes: Note[]
}

interface Game {
  id: number
  title: string
  description: string
  category: string
  icon: string
  difficulty: string
  features: string[]
  path: string
}

// 响应式数据
const activeSection = ref('home')
const currentTime = ref('00:00')
const uptime = ref(0)
const selectedCategory = ref<Category | null>(null)

// 飞船鼠标相关数据
const spaceshipCursor = ref<HTMLElement>()
const ionTrail = ref<HTMLElement>()
const mouseX = ref(0)
const mouseY = ref(0)
const prevMouseX = ref(0)
const prevMouseY = ref(0)
const currentAngle = ref(0)
const targetAngle = ref(0)
const spaceshipRotation = ref({ transform: 'rotate(0deg)' })
const spaceshipClasses = ref<string[]>([])
let animationFrame: number | null = null
let lastUpdateTime = 0

// 统计数据
const blogStats = reactive({
  count: 0
})

const gameStats = reactive({
  count: 0
})

// 博客笔记数据
const blogCategories = reactive<Category[]>([
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
])

// 游戏数据
const games = reactive<Game[]>([
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
])

// 方法
const setActiveSection = (section: string) => {
  activeSection.value = section
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const startUptimeCounter = () => {
  let internalUptime = 0
  setInterval(() => {
    internalUptime++
    if (internalUptime % 10 === 0) {
      uptime.value = internalUptime
    }
  }, 1000)
}

const formatUptime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`
  } else {
    return `${secs}秒`
  }
}

const generateParticles = () => {
  const container = document.getElementById('staticParticles')
  if (!container) return
  
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle'
    
    Object.assign(particle.style, {
      left: Math.random() * 100 + '%',
      animationDelay: Math.random() * 20 + 's',
      animationDuration: (45 + Math.random() * 30) + 's'
    })
    
    container.appendChild(particle)
  }
}

const selectCategory = (category: Category) => {
  selectedCategory.value = category
}

const backToCategories = () => {
  selectedCategory.value = null
}

const calculateStats = () => {
  blogStats.count = blogCategories.reduce((total, category) => {
    return total + category.notes.length
  }, 0)
  
  gameStats.count = games.length
}

const openNote = (note: Note) => {
  window.open(note.path, '_blank')
}

const openGame = (game: Game) => {
  window.open(game.path, '_blank')
}

// 飞船鼠标相关方法
const initSpaceshipCursor = () => {
  document.addEventListener('mousemove', (e) => {
    const now = performance.now()
    
    if (now - lastUpdateTime < 16) return
    lastUpdateTime = now
    
    prevMouseX.value = mouseX.value
    prevMouseY.value = mouseY.value
    mouseX.value = e.clientX
    mouseY.value = e.clientY
    
    updateSpaceshipPosition()
    calculateTargetAngle()
    checkAcceleration()
    createIonParticles()
  })
  
  document.addEventListener('mousedown', () => {
    triggerAcceleration()
  })
  
  startRotationAnimation()
}

const updateSpaceshipPosition = () => {
  if (spaceshipCursor.value) {
    const tipDistance = 30
    const angle = currentAngle.value * (Math.PI / 180)
    const tipOffsetX = Math.sin(angle) * tipDistance
    const tipOffsetY = -Math.cos(angle) * tipDistance
    
    const offsetX = mouseX.value - 75 - tipOffsetX
    const offsetY = mouseY.value - 75 - tipOffsetY
    
    spaceshipCursor.value.style.transform = `translate(${offsetX}px, ${offsetY}px)`
  }
}

const calculateTargetAngle = () => {
  const deltaX = mouseX.value - prevMouseX.value
  const deltaY = mouseY.value - prevMouseY.value
  const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  
  if (speed > 0.3) {
    targetAngle.value = Math.atan2(deltaX, -deltaY) * (180 / Math.PI)
  }
}

const startRotationAnimation = () => {
  const animate = () => {
    let angleDiff = targetAngle.value - currentAngle.value
    
    if (angleDiff > 180) {
      angleDiff -= 360
    } else if (angleDiff < -180) {
      angleDiff += 360
    }
    
    const lerpSpeed = 0.25
    currentAngle.value += angleDiff * lerpSpeed
    
    if (currentAngle.value >= 360) {
      currentAngle.value -= 360
    } else if (currentAngle.value < 0) {
      currentAngle.value += 360
    }
    
    spaceshipRotation.value = {
      transform: `rotate(${currentAngle.value}deg)`
    }
    
    animationFrame = requestAnimationFrame(animate)
  }
  
  animate()
}

const checkAcceleration = () => {
  const deltaX = mouseX.value - prevMouseX.value
  const deltaY = mouseY.value - prevMouseY.value
  const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  
  spaceshipClasses.value = []
  if (speed > 10) {
    spaceshipClasses.value.push('spaceship-fast')
  }
  if (speed > 20) {
    spaceshipClasses.value.push('spaceship-accelerating')
  }
}

const triggerAcceleration = () => {
  spaceshipClasses.value.push('spaceship-accelerating')
  setTimeout(() => {
    spaceshipClasses.value = spaceshipClasses.value.filter(c => c !== 'spaceship-accelerating')
  }, 300)
}

const createIonParticles = () => {
  if (!ionTrail.value) return
  
  const deltaX = mouseX.value - prevMouseX.value
  const deltaY = mouseY.value - prevMouseY.value
  const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  
  const particleCount = Math.min(Math.floor(speed / 8), 2)
  
  if (speed > 3) {
    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        const particle = document.createElement('div')
        particle.className = 'ion-particle'
        
        const offsetX = (Math.random() - 0.5) * 50
        const offsetY = (Math.random() - 0.5) * 25
        
        particle.style.left = '50%'
        particle.style.top = '50%'
        particle.style.transform = `translate(${offsetX}px, ${offsetY}px)`
        
        ionTrail.value?.appendChild(particle)
        
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle)
          }
        }, 500)
      }, i * 80)
    }
  }
}

const forceHideCursor = () => {
  const style = document.createElement('style')
  style.textContent = `
    * { cursor: none !important; }
    body * { cursor: none !important; }
  `
  document.head.appendChild(style)
}

// 组件挂载时初始化
onMounted(() => {
  updateTime()
  startUptimeCounter()
  calculateStats()
  
  nextTick(() => {
    generateParticles()
    initSpaceshipCursor()
    forceHideCursor()
  })
  
  setInterval(updateTime, 1000)
})
</script>

<template>
  <div id="app">
    <!-- 飞船鼠标 -->
    <div class="spaceship-cursor" ref="spaceshipCursor" :class="spaceshipClasses">
      <div class="spaceship" :style="spaceshipRotation">
        <div class="spaceship-body">
          <i class="fas fa-rocket"></i>
        </div>
        <div class="spaceship-trail"></div>
        <div class="ion-trail" ref="ionTrail"></div>
      </div>
    </div>
    
    <!-- 背景粒子效果 -->
    <div class="particles-container" id="staticParticles">
      <!-- 粒子将通过JavaScript创建 -->
    </div>
    
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 头部 -->
      <header class="header">
        <div class="logo">
          <div class="logo-icon">
            <div class="hexagon">
              <span>{{ currentTime }}</span>
            </div>
          </div>
          <h1 class="logo-text">
            <span class="gradient-text">个人空间</span>
            <span class="subtitle">PERSONAL SPACE</span>
          </h1>
        </div>
        
        <nav class="nav-menu">
          <button 
            class="nav-btn" 
            :class="{ active: activeSection === 'home' }"
            @click="setActiveSection('home')"
          >
            <i class="fas fa-home nav-icon"></i>
            首页
          </button>
          <button 
            class="nav-btn" 
            :class="{ active: activeSection === 'blog' }"
            @click="setActiveSection('blog')"
          >
            <i class="fas fa-book nav-icon"></i>
            博客笔记
          </button>
          <button 
            class="nav-btn" 
            :class="{ active: activeSection === 'games' }"
            @click="setActiveSection('games')"
          >
            <i class="fas fa-gamepad nav-icon"></i>
            小游戏
          </button>
        </nav>
      </header>

      <!-- 主内容区 -->
      <main class="main-content">
        <!-- 首页 -->
        <section v-if="activeSection === 'home'" class="section home-section">
          <div class="welcome-card">
            <div class="welcome-header">
              <h2 class="welcome-title">欢迎来到我的数字空间</h2>
              <p class="welcome-subtitle">探索知识与娱乐的完美结合</p>
            </div>
            
            <div class="feature-grid">
              <div class="feature-card" @click="setActiveSection('blog')">
                <div class="feature-icon">
                  <i class="fas fa-book-open"></i>
                </div>
                <h3>技术博客</h3>
                <p>记录学习心得与技术分享</p>
                <div class="feature-stats">
                  <span>{{ blogStats.count }} 篇笔记</span>
                </div>
              </div>
              
              <div class="feature-card" @click="setActiveSection('games')">
                <div class="feature-icon">
                  <i class="fas fa-rocket"></i>
                </div>
                <h3>休闲游戏</h3>
                <p>放松身心的小游戏合集</p>
                <div class="feature-stats">
                  <span>{{ gameStats.count }} 个游戏</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 博客笔记 -->
        <section v-if="activeSection === 'blog'" class="section blog-section">
          <!-- 分类列表视图 -->
          <div v-if="!selectedCategory">
            <div class="section-header">
              <h2 class="section-title"><i class="fas fa-book"></i> 技术博客</h2>
              <p class="section-subtitle">似我，非我</p>
            </div>
            
            <div class="cards-grid">
              <div 
                class="content-card category-card" 
                v-for="category in blogCategories" 
                :key="category.id"
                @click="selectCategory(category)"
              >
                <div class="card-header">
                  <div class="card-icon">
                    <i :class="category.icon"></i>
                  </div>
                  <div class="card-meta">
                    <span class="card-category">{{ category.notes.length }} 篇笔记</span>
                  </div>
                </div>
                <h3 class="card-title">{{ category.title }}</h3>
                <p class="card-description">{{ category.description }}</p>
                <div class="card-footer">
                  <span class="view-notes-btn">查看笔记 <i class="fas fa-arrow-right"></i></span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 具体分类的笔记列表 -->
          <div v-if="selectedCategory">
            <div class="section-header">
              <button class="back-btn" @click="backToCategories()">
                <i class="fas fa-arrow-left"></i> 返回分类
              </button>
              <h2 class="section-title">
                <i :class="selectedCategory.icon"></i> {{ selectedCategory.title }}
              </h2>
              <p class="section-subtitle">{{ selectedCategory.description }}</p>
            </div>
            
            <div class="cards-grid">
              <div 
                class="content-card" 
                v-for="note in selectedCategory.notes" 
                :key="note.id"
                @click="openNote(note)"
              >
                <div class="card-header">
                  <div class="card-icon">
                    <i :class="note.icon"></i>
                  </div>
                  <div class="card-meta">
                    <span class="card-date">{{ note.date }}</span>
                  </div>
                </div>
                <h3 class="card-title">{{ note.title }}</h3>
                <p class="card-description">{{ note.description }}</p>
                <div class="card-tags">
                  <span class="tag" v-for="tag in note.tags" :key="tag">{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 小游戏 -->
        <section v-if="activeSection === 'games'" class="section games-section">
          <div class="section-header">
            <h2 class="section-title"><i class="fas fa-gamepad"></i> 游戏中心</h2>
            <p class="section-subtitle">搞事情</p>
          </div>
          
          <div class="cards-grid">
            <div 
              class="content-card game-card" 
              v-for="game in games" 
              :key="game.id"
              @click="openGame(game)"
            >
              <div class="card-header">
                <div class="card-icon">
                  <i :class="game.icon"></i>
                </div>
                <div class="card-meta">
                  <span class="card-category">{{ game.category }}</span>
                  <span class="difficulty">{{ game.difficulty }}</span>
                </div>
              </div>
              <h3 class="card-title">{{ game.title }}</h3>
              <p class="card-description">{{ game.description }}</p>
              <div class="card-features">
                <span class="feature" v-for="feature in game.features" :key="feature">{{ feature }}</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <!-- 底部 -->
      <footer class="footer">
        <div class="footer-content">
          <p>&copy; 2025 魏子政的个人空间 | 探索 · 学习 · 搞事情</p>
          <div class="footer-stats">
            <span>运行时间: {{ formatUptime(uptime) }}</span>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<style>
/* 导入原始样式 */
@import './assets/main.css';
</style>
