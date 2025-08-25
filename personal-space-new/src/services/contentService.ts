// 内容服务 - 负责动态加载内容
export interface Note {
  id: number
  title: string
  description: string
  icon: string
  date: string
  tags: string[]
  path: string
}

export interface Category {
  id: string
  title: string
  icon: string
  description: string
  folderPath: string
  notes: Note[]
}

export interface Game {
  id: string
  title: string
  description: string
  category: string
  icon: string
  difficulty: string
  features: string[]
  folderPath: string
  entryFile: string
  path: string
}

export interface ContentConfig {
  blogCategories: Category[]
  games: Game[]
}

class ContentService {
  private config: ContentConfig | null = null
  private baseUrl = import.meta.env.BASE_URL || '/'

  // 加载配置文件
  async loadConfig(): Promise<ContentConfig> {
    if (this.config) {
      return this.config
    }

    try {
      const response = await fetch(`${this.baseUrl}content-config.json`)
      if (!response.ok) {
        throw new Error('Failed to load content config')
      }
      const rawConfig = await response.json()
      console.log('Raw config loaded:', {
        games: rawConfig.games?.map(g => ({ id: g.id, path: g.path })) || []
      })
      this.config = rawConfig
      
      // 处理游戏描述（保持配置文件中的路径不变）
      this.config!.games = this.config!.games.map(game => ({
        ...game,
        // 只在路径不存在时才生成路径，否则保持配置文件中的路径
        path: game.path || `${game.folderPath}/${game.entryFile}`,
        description: game.description || this.generateGameDescription(game)
      }))
      
      console.log('Processed config games:', {
        games: this.config!.games.map(g => ({ id: g.id, path: g.path }))
      })

      return this.config!
    } catch (error) {
      console.error('Error loading content config:', error)
      // 返回默认配置
      return this.getDefaultConfig()
    }
  }

  // 生成游戏描述
  private generateGameDescription(game: Game): string {
    const descriptions: Record<string, string> = {
      'monkey-tree': '帮助可爱的猴子收集椰子，挑战更高关卡！考验你的时机把握和策略规划能力。',
      'decision-helper': '随机选择工具合集，包含投骰子、幸运转盘、抛硬币等多种随机决策工具，帮你解决选择困难症。'
    }
    return descriptions[game.id] || `${game.title} - ${game.category}游戏`
  }

  // 扫描笔记文件夹并生成笔记列表
  async scanNotes(category: Category): Promise<Note[]> {
    // 在实际部署中，这里需要通过API或构建时预处理来获取文件列表
    // 由于静态部署的限制，我们使用预定义的笔记数据
    const noteDatabase: Record<string, Note[]> = {
      'git': [
        {
          id: 1,
          title: 'Git 版本管理完整指南',
          description: '从基础操作到分支管理，全面掌握Git版本控制系统的使用方法和最佳实践。',
          icon: 'fas fa-code-branch',
          date: '2024-01',
          tags: ['Git', '版本控制', '协作开发'],
          path: '笔记/git版本管理/git操作笔记.html'
        }
      ],
      'linux': [
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

    return noteDatabase[category.id] || []
  }

  // 检查文件是否存在
  async checkFileExists(path: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  // 获取默认配置
  private getDefaultConfig(): ContentConfig {
    return {
      blogCategories: [
        {
          id: 'git',
          title: 'Git版本管理',
          icon: 'fas fa-code-branch',
          description: '版本控制系统学习笔记',
          folderPath: '笔记/git版本管理',
          notes: []
        },
        {
          id: 'linux',
          title: 'Linux系统使用心得',
          icon: 'fab fa-linux',
          description: 'Linux系统管理和工具使用经验',
          folderPath: '笔记/linux系统使用心得',
          notes: []
        }
      ],
      games: [
        {
          id: 'monkey-tree',
          title: '猴子爬树吃椰子',
          description: '帮助可爱的猴子收集椰子，挑战更高关卡！考验你的时机把握和策略规划能力。',
          category: '动作游戏',
          icon: 'fas fa-tree',
          difficulty: '简单',
          features: ['关卡挑战', '时间限制', '技巧操作'],
          folderPath: '小游戏/猴子上树',
          entryFile: 'index.html',
          path: '/content/games/monkey-tree/index.html'
        },
        {
          id: 'decision-helper',
          title: '选择困难症福音',
          description: '随机选择工具合集，包含投骰子、幸运转盘、抛硬币等多种随机决策工具，帮你解决选择困难症。',
          category: '工具合集',
          icon: 'fas fa-dice',
          difficulty: '简单',
          features: ['投骰子', '幸运转盘', '抛硬币', '随机决策'],
          folderPath: '小游戏/选择困难症福音',
          entryFile: 'index.html',
          path: '/content/games/decision-helper/index.html'
        }
      ]
    }
  }

  // 清除缓存
  clearCache(): void {
    this.config = null
    console.log('ContentService cache cleared')
  }

  // 刷新内容（重新加载配置和扫描文件）
  async refreshContent(): Promise<ContentConfig> {
    this.config = null
    const config = await this.loadConfig()
    
    // 配置文件中已经包含了扫描到的笔记数据，不需要再次扫描
    // 只需要确保笔记路径和属性正确
    for (const category of config.blogCategories) {
      category.notes.forEach(note => {
        // 确保笔记有正确的图标（如果没有则使用分类图标）
        if (!note.icon) {
          note.icon = category.icon
        }
      })
    }
    
    // 为游戏生成描述（路径已在扫描时生成）
    config.games.forEach(game => {
      if (!game.description) {
        game.description = this.generateGameDescription(game)
      }
      // 路径已在扫描脚本中正确设置，无需重新生成
    })
    
    this.config = config
    return config
  }
}

// 导出单例实例
export const contentService = new ContentService() 