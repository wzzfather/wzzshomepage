#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 创建public目录下的内容文件夹
function ensurePublicContentDirs() {
  const publicContentDir = path.join(__dirname, '../public/content')
  const notesDir = path.join(publicContentDir, 'notes')
  const gamesDir = path.join(publicContentDir, 'games')
  
  if (!fs.existsSync(publicContentDir)) {
    fs.mkdirSync(publicContentDir, { recursive: true })
  }
  if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true })
  }
  if (!fs.existsSync(gamesDir)) {
    fs.mkdirSync(gamesDir, { recursive: true })
  }
  
  return { publicContentDir, notesDir, gamesDir }
}

// 复制文件到public目录
function copyToPublic(sourcePath, targetPath) {
  try {
    const sourceDir = path.dirname(sourcePath)
    const targetDir = path.dirname(targetPath)
    
    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }
    
    // 复制HTML文件
    fs.copyFileSync(sourcePath, targetPath)
    
    // 复制相关的CSS文件（如果存在）
    const cssFile = path.join(sourceDir, 'note.css')
    if (fs.existsSync(cssFile)) {
      const targetCssFile = path.join(targetDir, 'note.css')
      fs.copyFileSync(cssFile, targetCssFile)
    }
    
    console.log(`✅ 已复制: ${sourcePath} -> ${targetPath}`)
    return true
  } catch (error) {
    console.error(`❌ 复制失败: ${sourcePath}`, error.message)
    return false
  }
}

// 项目根目录
const projectRoot = path.join(__dirname, '..')
const publicDir = path.join(projectRoot, 'public')
const parentDir = path.join(projectRoot, '..')

// 分类图标映射
const categoryIcons = {
  'git版本管理': 'fas fa-code-branch',
  'linux系统使用心得': 'fab fa-linux',
  'RAG搭建': 'fas fa-brain',
  'python学习': 'fab fa-python',
  'javascript学习': 'fab fa-js-square',
  'vue学习': 'fab fa-vuejs',
  'react学习': 'fab fa-react',
  '数据库': 'fas fa-database',
  '算法': 'fas fa-calculator',
  '网络安全': 'fas fa-shield-alt',
  '机器学习': 'fas fa-robot',
  '前端开发': 'fas fa-code',
  '后端开发': 'fas fa-server',
  '系统运维': 'fas fa-cogs'
}

// 自动发现笔记分类
function discoverNoteCategories() {
  const notesDir = path.join(parentDir, '笔记')
  const categories = []
  
  if (!fs.existsSync(notesDir)) {
    console.warn('笔记目录不存在:', notesDir)
    return categories
  }

  try {
    const folders = fs.readdirSync(notesDir, { withFileTypes: true })
    
    folders.forEach(folder => {
      if (folder.isDirectory()) {
        const folderName = folder.name
        const folderPath = path.join(notesDir, folderName)
        
        // 检查文件夹中是否有HTML文件
        const files = fs.readdirSync(folderPath)
        const hasHtmlFiles = files.some(file => file.endsWith('.html'))
        
        if (hasHtmlFiles) {
          const categoryId = folderName.toLowerCase().replace(/[^a-z0-9]/g, '-')
          const icon = categoryIcons[folderName] || 'fas fa-file-alt'
          
          categories.push({
            id: categoryId,
            title: folderName,
            icon: icon,
            description: `${folderName}相关学习笔记`,
            folderPath: `笔记/${folderName}`,
            notes: []
          })
          
          console.log(`发现笔记分类: ${folderName} (图标: ${icon})`)
        }
      }
    })
  } catch (error) {
    console.error('扫描笔记分类失败:', error.message)
  }
  
  return categories
}

// 内容配置
const config = {
  blogCategories: [],
  games: [
    {
      id: 'monkey-tree',
      title: '猴子爬树吃椰子',
      category: '动作游戏',
      icon: 'fas fa-tree',
      difficulty: '简单',
      features: ['关卡挑战', '时间限制', '技巧操作'],
      folderPath: '小游戏/猴子上树',
      entryFile: 'index.html'
    },
    {
      id: 'decision-helper',
      title: '选择困难症福音',
      category: '工具合集',
      icon: 'fas fa-dice',
      difficulty: '简单',
      features: ['投骰子', '幸运转盘', '抛硬币', '随机决策'],
      folderPath: '小游戏/选择困难症福音',
      entryFile: 'index.html'
    }
  ]
}

// 扫描笔记文件夹
function scanNotesFolder(categoryConfig) {
  const folderPath = path.join(parentDir, categoryConfig.folderPath)
  const notes = []
  
  if (!fs.existsSync(folderPath)) {
    console.warn(`文件夹不存在: ${folderPath}`)
    return notes
  }

  try {
    const files = fs.readdirSync(folderPath)
    let noteId = 1

    files.forEach(file => {
      if (file.endsWith('.html')) {
        const filePath = path.join(folderPath, file)
        const stats = fs.statSync(filePath)
        
        // 尝试从HTML文件中提取标题
        let title = path.basename(file, '.html')
        let description = `${categoryConfig.title}相关笔记`
        
        try {
          const content = fs.readFileSync(filePath, 'utf-8')
          const titleMatch = content.match(/<title>(.*?)<\/title>/i)
          if (titleMatch) {
            title = titleMatch[1]
          }
          
          // 提取meta描述或第一个段落
          const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) ||
                           content.match(/<p[^>]*>(.*?)<\/p>/i)
          if (descMatch) {
            description = descMatch[1].replace(/<[^>]*>/g, '').substring(0, 100) + '...'
          }
        } catch (e) {
          console.warn(`无法读取文件内容: ${filePath}`)
        }

        // 创建分类目录
        const { notesDir } = ensurePublicContentDirs()
        const categoryDir = path.join(notesDir, categoryConfig.id)
        if (!fs.existsSync(categoryDir)) {
          fs.mkdirSync(categoryDir, { recursive: true })
        }
        
        // 复制文件到public目录
        const targetPath = path.join(categoryDir, file)
        const publicPath = `content/notes/${categoryConfig.id}/${file}`
        
        if (copyToPublic(filePath, targetPath)) {
          notes.push({
            id: noteId++,
            title: title,
            description: description,
            icon: categoryConfig.icon,
            date: stats.mtime.toISOString().substring(0, 7), // YYYY-MM格式
            tags: [categoryConfig.title, '笔记'],
            path: publicPath // 使用public目录中的路径
          })
        }
      }
    })

    console.log(`扫描到 ${notes.length} 个笔记文件在 ${categoryConfig.folderPath}`)
  } catch (error) {
    console.error(`扫描笔记文件夹失败: ${folderPath}`, error.message)
  }

  return notes
}

// 扫描游戏文件夹
function scanGamesFolder() {
  const scannedGames = []
  const { gamesDir } = ensurePublicContentDirs()
  
  config.games.forEach(gameConfig => {
    const gamePath = path.join(parentDir, gameConfig.folderPath)
    const entryPath = path.join(gamePath, gameConfig.entryFile)
    
    if (fs.existsSync(entryPath)) {
      console.log(`发现游戏: ${gameConfig.title} (${gameConfig.folderPath})`)
      
      // 创建游戏目录
      const gameDir = path.join(gamesDir, gameConfig.id)
      if (!fs.existsSync(gameDir)) {
        fs.mkdirSync(gameDir, { recursive: true })
      }
      
      // 复制整个游戏文件夹到public目录
      copyGameFolder(gamePath, gameDir)
      
      // 更新游戏路径
      const updatedGame = {
        ...gameConfig,
        path: `content/games/${gameConfig.id}/${gameConfig.entryFile}`
      }
      
      scannedGames.push(updatedGame)
    } else {
      console.warn(`游戏入口文件不存在: ${entryPath}`)
    }
  })

  return scannedGames
}

// 复制游戏文件夹
function copyGameFolder(sourceDir, targetDir) {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }
    
    const items = fs.readdirSync(sourceDir)
    
    items.forEach(item => {
      const sourcePath = path.join(sourceDir, item)
      const targetPath = path.join(targetDir, item)
      const stat = fs.statSync(sourcePath)
      
      if (stat.isDirectory()) {
        copyGameFolder(sourcePath, targetPath) // 递归复制子文件夹
      } else {
        fs.copyFileSync(sourcePath, targetPath)
        console.log(`✅ 已复制游戏文件: ${sourcePath} -> ${targetPath}`)
      }
    })
  } catch (error) {
    console.error(`❌ 复制游戏文件夹失败: ${sourceDir}`, error.message)
  }
}

// 主扫描函数
function scanContent() {
  console.log('开始扫描内容...')
  console.log('项目根目录:', projectRoot)
  console.log('父目录:', parentDir)

  // 自动发现笔记分类
  config.blogCategories = discoverNoteCategories()

  // 扫描每个分类的笔记
  config.blogCategories.forEach(category => {
    category.notes = scanNotesFolder(category)
  })

  // 扫描游戏
  config.games = scanGamesFolder()

  // 生成配置文件
  const outputPath = path.join(publicDir, 'content-config.json')
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2))
  
  console.log('内容扫描完成!')
  console.log(`配置文件已生成: ${outputPath}`)
  console.log(`总共扫描到:`)
  console.log(`- 笔记分类: ${config.blogCategories.length}`)
  console.log(`- 笔记文章: ${config.blogCategories.reduce((sum, cat) => sum + cat.notes.length, 0)}`)
  console.log(`- 游戏: ${config.games.length}`)
}

// 执行扫描
scanContent()

export { scanContent } 