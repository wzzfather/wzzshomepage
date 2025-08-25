<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed, watch } from 'vue'
import { contentService, type Note, type Category, type Game } from './services/contentService'

// 响应式数据
const activeSection = ref('home')
const currentTime = ref('00:00')
const uptime = ref(0)
const selectedCategory = ref<Category | null>(null)
const isLoading = ref(true)
const refreshing = ref(false)

// 动态布局相关数据
const layoutConfig = reactive({
  cardColumns: 'auto-fill', // auto-fill, auto-fit, 或固定数量
  cardMinWidth: 350, // 卡片最小宽度
  adaptiveGrid: true, // 是否启用自适应网格
  animateChanges: true // 是否启用变化动画
})

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

// 动态内容数据
const blogCategories = reactive<Category[]>([])
const games = reactive<Game[]>([])

// 动态样式计算
const dynamicGridStyle = computed(() => {
  const itemCount = getCurrentItemCount()
  
  // 根据内容数量动态调整布局
  if (layoutConfig.adaptiveGrid) {
    if (itemCount === 1) {
      return {
        gridTemplateColumns: '1fr',
        maxWidth: '600px',
        margin: '0 auto'
      }
    } else if (itemCount === 2) {
      return {
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '2rem'
      }
    } else if (itemCount <= 4) {
      return {
        gridTemplateColumns: `repeat(auto-fit, minmax(${layoutConfig.cardMinWidth}px, 1fr))`,
        gap: '1.5rem'
      }
    } else {
      return {
        gridTemplateColumns: `repeat(auto-fill, minmax(${layoutConfig.cardMinWidth}px, 1fr))`,
        gap: '1.5rem'
      }
    }
  }
  
  return {
    gridTemplateColumns: `repeat(${layoutConfig.cardColumns}, minmax(${layoutConfig.cardMinWidth}px, 1fr))`
  }
})

// 获取当前显示的内容项数量
const getCurrentItemCount = () => {
  if (activeSection.value === 'home') {
    return 2 // 固定的功能卡片
  } else if (activeSection.value === 'blog') {
    if (selectedCategory.value) {
      return selectedCategory.value.notes.length
    } else {
      return blogCategories.length
    }
  } else if (activeSection.value === 'games') {
    return games.length
  }
  return 0
}

// 动态计算特殊布局类名
const getLayoutClasses = computed(() => {
  const itemCount = getCurrentItemCount()
  const classes = ['cards-grid']
  
  if (layoutConfig.animateChanges) {
    classes.push('animated-grid')
  }
  
  if (itemCount === 1) {
    classes.push('single-item')
  } else if (itemCount === 2) {
    classes.push('dual-item')
  } else if (itemCount <= 4) {
    classes.push('small-grid')
  } else {
    classes.push('large-grid')
  }
  
  return classes.join(' ')
})

// 计算空状态显示
const isEmpty = computed(() => {
  if (activeSection.value === 'blog') {
    if (selectedCategory.value) {
      return selectedCategory.value.notes.length === 0
    } else {
      return blogCategories.length === 0
    }
  } else if (activeSection.value === 'games') {
    return games.length === 0
  }
  return false
})

// 加载内容
const loadContent = async () => {
  try {
    isLoading.value = true
    // 强制清除缓存确保加载最新数据
    contentService.clearCache()
    const config = await contentService.refreshContent()
    
    // 清空现有数据
    blogCategories.splice(0, blogCategories.length)
    games.splice(0, games.length)
    
    // 添加新数据
    blogCategories.push(...config.blogCategories)
    games.push(...config.games)
    
    // 调试输出游戏数据
    console.log('Loaded games data:', games.map(game => ({
      id: game.id,
      title: game.title,
      path: game.path
    })))
    
    // 重新计算统计
    calculateStats()
    
    // 触发布局更新动画
    await triggerLayoutUpdate()
    
    console.log('Content loaded successfully:', {
      categories: blogCategories.length,
      games: games.length,
      totalNotes: blogStats.count,
      currentLayout: dynamicGridStyle.value
    })
  } catch (error) {
    console.error('Failed to load content:', error)
  } finally {
    isLoading.value = false
  }
}

// 刷新内容
const refreshContent = async () => {
  try {
    refreshing.value = true
    // 强制清除缓存
    contentService.clearCache()
    await loadContent()
    // 显示刷新成功提示
    console.log('Content refreshed!')
  } catch (error) {
    console.error('Failed to refresh content:', error)
  } finally {
    refreshing.value = false
  }
}

// 触发布局更新动画
const triggerLayoutUpdate = async () => {
  if (layoutConfig.animateChanges) {
    // 添加更新动画类
    const grids = document.querySelectorAll('.cards-grid')
    grids.forEach(grid => {
      grid.classList.add('layout-updating')
    })
    
    // 等待下一帧后移除动画类
    await nextTick()
    setTimeout(() => {
      grids.forEach(grid => {
        grid.classList.remove('layout-updating')
      })
    }, 300)
  }
}

// 监听内容变化并更新布局
watch([blogCategories, games, activeSection, selectedCategory], () => {
  nextTick(() => {
    triggerLayoutUpdate()
  })
}, { deep: true })

// 方法
const setActiveSection = (section: string) => {
  activeSection.value = section
  selectedCategory.value = null // 重置选中的分类
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
  console.log('Opening game:', game.title, 'Path:', game.path)
  if (!game.path) {
    console.error('Game path is undefined:', game)
    return
  }
  window.open(game.path, '_blank')
}

// 导航相关方法
const openAboutPage = () => {
  console.log('Opening about page')
  window.open('/showMyself/index.html', '_blank')
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
onMounted(async () => {
  updateTime()
  startUptimeCounter()
  
  // 加载动态内容
  await loadContent()
  
  nextTick(() => {
    generateParticles()
    initSpaceshipCursor()
    forceHideCursor()
  })
  
  setInterval(updateTime, 1000)
  
  // 每5分钟自动刷新内容（可选）
  setInterval(refreshContent, 5 * 60 * 1000)
})

// 暴露刷新方法到全局（用于调试）
if (import.meta.env.DEV) {
  ;(window as any).refreshContent = refreshContent
}
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
            :class="{ active: activeSection === 'about' }"
            @click="openAboutPage()"
          >
            <i class="fas fa-user nav-icon"></i>
            关于我
          </button>
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
          
          <!-- 内容刷新按钮 -->
          <button 
            class="nav-btn refresh-btn" 
            :class="{ refreshing: refreshing }"
            @click="refreshContent"
            :disabled="refreshing"
            title="刷新内容"
          >
            <i class="fas fa-sync-alt nav-icon" :class="{ 'fa-spin': refreshing }"></i>
            <span v-if="!refreshing">刷新</span>
            <span v-else>加载中</span>
          </button>
        </nav>
      </header>

      <!-- 主内容区 -->
      <main class="main-content" :class="{ loading: isLoading }">
        <!-- 加载指示器 -->
        <div v-if="isLoading" class="loading-overlay">
          <div class="loading-spinner">
            <i class="fas fa-sync-alt fa-spin"></i>
          </div>
          <p>正在加载内容...</p>
        </div>
        
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
            
            <!-- 空状态显示 -->
            <div v-if="isEmpty" class="empty-state">
              <div class="empty-icon">
                <i class="fas fa-book-open"></i>
              </div>
              <h3>暂无笔记分类</h3>
              <p>点击刷新按钮或添加新的笔记文件夹</p>
            </div>
            
            <!-- 内容网格 -->
            <div v-else :class="getLayoutClasses" :style="dynamicGridStyle">
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
            
            <div :class="getLayoutClasses" :style="dynamicGridStyle">
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
          
          <!-- 空状态显示 -->
          <div v-if="isEmpty" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-gamepad"></i>
            </div>
            <h3>暂无游戏</h3>
            <p>点击刷新按钮或添加新的游戏文件夹</p>
          </div>
          
          <!-- 内容网格 -->
          <div v-else :class="getLayoutClasses" :style="dynamicGridStyle">
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
