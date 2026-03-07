export default {
  common: {
    // 通用操作
    add: '新增',
    edit: '编辑',
    delete: '删除',
    save: '保存',
    cancel: '取消',
    confirm: '确定',
    search: '搜索',
    refresh: '刷新',
    submit: '提交',
    export: '导出',
    import: '导入',
    view: '查看',
    back: '返回',

    // 状态
    loading: '加载中...',
    success: '操作成功',
    error: '操作失败',
    warning: '警告',
    info: '提示',

    // 分页
    pagination: {
      total: '共 {total} 条',
      pageSize: '条/页',
    },

    // 表单验证
    validation: {
      required: '请输入{field}',
      requiredSelect: '请选择{field}',
      email: '请输入有效的邮箱地址',
    },

    // 确认对话框
    confirmDelete: '确定要删除吗？',
    confirmAction: '确定要执行此操作吗？',
  },

  // ==================== 侧边栏导航 ====================
  sidebar: {
    dashboard: '数据总览',
    knowledge: '知识库管理',
    memory: '记忆库管理',
    questioning: '问数管理',
    users: '用户管理',
    strategy: '问答策略',
    logout: '退出登录',
  },

  // ==================== 登录页面 ====================
  login: {
    title: 'AIDP Manager',
    subtitle: 'AI Data Platform Management System',
    username: '用户名',
    usernamePlaceholder: '请输入用户名',
    password: '密码',
    passwordPlaceholder: '请输入密码',
    loginButton: '登录',
    loggingIn: '登录中...',
    loginSuccess: '登录成功',
    loginFailed: '登录失败，请检查用户名和密码',
  },

  // ==================== 数据总览 ====================
  dashboard: {
    title: '数据总览',

    // 统计卡片
    stats: {
      totalUsers: '总用户数',
      activeUsers: '活跃用户',
      totalDocuments: '知识库文档',
      vectorizedDocs: '向量索引',
      todayQuestions: '今日问答',
      avgResponseTime: '平均响应时间',
    },

    // 系统概览
    overview: {
      title: '系统概览',
      vectorCount: '向量索引数',
      avgResponseTime: '平均响应时间',
      categoryCount: '分类数量',
      successRate: '成功率',
      unit个: '个',
      unit条: '条',
      unit秒: '秒',
      unit次: '次',
    },

    // 图表
    charts: {
      userGrowth: '用户增长趋势',
      userGrowthPeriod: '用户增长趋势（近30天）',
      questionVolume: '问答量统计',
      questionVolumePeriod: '问答量统计（近7天）',
      categoryDistribution: '知识库分类分布',
      docCount: '文档数量',
      categoryDist: '分类分布',
      qaStats: '问答统计',
      qaStatsPeriod: '问答统计（近7天）',
      last7Days: '最近7天',
      last30Days: '最近30天',
    },

    // 快捷操作
    quickActions: {
      addDocument: '新增文档',
      manageUsers: '用户管理',
      settings: '系统设置',
      viewLogs: '查看日志',
    },

    // 最近活动
    recentActivity: {
      title: '最近活动',
      userLogin: '用户登录',
      documentCreated: '文档创建',
      documentUpdated: '文档更新',
      questionAsked: '问答请求',
    },
  },

  // ==================== 知识库管理 ====================
  knowledge: {
    title: '知识库管理',

    // Tabs
    tabs: {
      intro: '知识库简介',
      mappings: '目录映射',
      files: '文件管理',
    },

    // 简介
    intro: {
      info: '知识库信息',
      name: 'AIDP Manager 知识库',
      nameValue: 'AIDP Manager 知识库',
      createTime: '创建时间',
      totalDocs: '文档总数',
      indexedDocs: '已索引文档',
      categoryCount: '分类数量',
      vectorDimension: '向量维度',
      storagePath: '存储路径',
      indexStatus: '索引状态',
      indexStatusNormal: '正常',
      description: '知识库说明',
      descriptionText: '本知识库采用向量检索技术，支持语义搜索。文档被向量化后，可以通过自然语言进行智能检索，系统会返回语义最相关的文档内容。',
      statsTotal: '总文档数',
      statsIndexed: '已索引',
      statsCategories: '分类数',
    },

    // 目录映射
    mappings: {
      title: '目录映射配置',
      addButton: '新增映射',
      description: '目录映射说明',
      descriptionText: '配置需要定期扫描和导入的目录任务。支持 NFS、S3 和本地文件系统。系统会记录每次入库的时间和操作人信息，可通过执行按钮手动触发入库任务。',

      // 列
      taskId: '任务ID',
      directoryName: '目录名称',
      directoryPath: '目录路径',
      fileSystem: '文件系统',
      lastImportTime: '最近一次目录入库时间',
      operator: '任务操作人',
      actions: '操作',

      // 按钮
      view: '查看',
      execute: '执行',
      delete: '删除',

      // 弹窗
      modalTitle: '新增目录映射',
      directoryNameLabel: '目录名称',
      directoryNamePlaceholder: '例如：技术文档目录',
      directoryPathLabel: '目录路径',
      directoryPathPlaceholder: '/data/documents/tech',
      fileSystemLabel: '文件系统',
      fileSystemPlaceholder: '请选择文件系统',
      fileSystemNFS: 'NFS',
      fileSystemS3: 'S3',
      fileSystemLOCAL: '本地文件系统',

      // 消息
      executeSuccess: '任务 {id} 已开始执行',
      deleteSuccess: '删除成功',
      addSuccess: '添加成功',
      deleteConfirm: '确定要删除这个映射任务吗？',
      detailTitle: '目录映射详情',
    },

    // 文件管理
    files: {
      title: '文档列表',
      addButton: '新增文档',
      semanticSearch: '语义搜索',
      batchImport: '批量导入',
      batchExport: '批量导出',
      rebuildIndex: '重建索引',
      rebuildConfirm: '确定要重建向量索引吗？这可能需要一些时间。',
      rebuildSuccess: '重建完成: {vectorized}/{total} 个文档',

      // 统计
      statsTotal: '总文档数',
      statsIndexed: '已索引',
      statsCategories: '分类数',
      statsCurrentPage: '当前页',

      // 搜索
      searchPlaceholder: '搜索文档标题、内容或标签',
      categoryPlaceholder: '选择分类',

      // 列
      colTitle: '标题',
      colCategory: '分类',
      colTags: '标签',
      colVectorized: '向量化',
      colIndexed: '已索引',
      colNotIndexed: '未索引',
      colUpdateTime: '更新时间',
      colActions: '操作',

      // 弹窗
      addModalTitle: '新增文档',
      editModalTitle: '编辑文档',
      titleLabel: '标题',
      titlePlaceholder: '请输入文档标题',
      categoryLabel: '分类',
      modalCategoryPlaceholder: '输入或选择分类',
      categoryHelp: '可以从现有分类中选择，或输入新的分类名称',
      tagsLabel: '标签',
      tagsPlaceholder: '输入标签，按回车添加',
      contentLabel: '内容',
      contentPlaceholder: '请输入文档内容',

      // 搜索弹窗
      searchModalTitle: '语义搜索',
      searchModalPlaceholder: '输入搜索内容，系统将使用语义搜索找到相关文档',
      searchResults: '搜索结果',
      similarity: '相似度',

      // 消息
      fetchFailed: '获取文档列表失败',
      deleteSuccess: '删除成功',
      deleteFailed: '删除失败',
      deleteConfirm: '确定要删除这个文档吗？',
      updateSuccess: '更新成功',
      updateFailed: '更新失败',
      createSuccess: '创建成功',
      createFailed: '创建失败',
      searchWarning: '请输入搜索内容',
      searchFailed: '搜索失败',
      indexWarning: '请输入搜索内容',
    },
  },

  // ==================== 记忆库管理 ====================
  memory: {
    title: '记忆库管理',

    // Tabs
    tabs: {
      list: '记忆列表',
      templates: '模板管理',
      permissions: '权限管理',
    },

    // 记忆列表
    list: {
      title: '记忆列表',
      addButton: '新增记忆',
      quickAdd: '快速添加',
      batchImport: '批量导入',
      batchExport: '批量导出',

      // 搜索
      searchPlaceholder: '搜索记忆标题、内容或标签',
      typePlaceholder: '记忆类型',
      categoryPlaceholder: '分类',
      importancePlaceholder: '最低重要性',

      // 列
      colTitle: '标题',
      colCategory: '分类',
      colType: '类型',
      colImportance: '重要性',
      colAccessCount: '访问次数',
      colCreateTime: '创建时间',
      content: '内容',
      category: '分类',
      type: '类型',
      importance: '重要性',
      accessCount: '访问次数',
      lastAccess: '最后访问',
      updateTime: '更新时间',
      actions: '操作',

      // 类型
      typeLongTerm: '长期记忆',
      typeShortTerm: '短期记忆',
      typeWorking: '工作记忆',

      // 弹窗
      addModalTitle: '新增记忆',
      editModalTitle: '编辑记忆',
      quickAddModalTitle: '快速添加记忆',
      titleLabel: '标题',
      titlePlaceholder: '请输入记忆标题',
      contentLabel: '内容',
      contentPlaceholder: '请输入记忆内容',
      categoryLabel: '分类',
      categoryHelp: '可以从现有分类中选择，或输入新的分类名称',
      categorySelectPlaceholder: '输入或选择分类',
      tagsLabel: '标签',
      tagsPlaceholder: '输入标签，按回车添加',
      typeLabel: '类型',
      importanceLabel: '重要性',

      // 统计
      statsTotal: '记忆总数',
      statsCategories: '分类数量',
      statsTypes: '类型数量',

      // 消息
      fetchFailed: '获取记忆列表失败',
      createSuccess: '创建成功',
      createFailed: '创建失败',
      updateSuccess: '更新成功',
      updateFailed: '更新失败',
      deleteSuccess: '删除成功',
      deleteFailed: '删除失败',
      deleteConfirm: '确定要删除这条记忆吗？',
      accessSuccess: '已更新访问信息',
      semanticSearch: '语义搜索',
      semanticSearchDeveloping: '语义搜索功能开发中',
    },

    // 模板管理
    templates: {
      title: '模板管理',
      addButton: '新增模板',
      description: '模板说明',
      descriptionText: '预设记忆模板可以快速创建特定类型的记忆，提高记录效率。模板包含默认的分类、记忆类型、重要性和标签。',

      // 列
      name: '模板名称',
      colDescription: '描述',
      fieldCount: '字段数量',
      lastUsed: '最后使用',
      actions: '操作',
      defaultImportance: '默认重要性',

      // 弹窗
      addModalTitle: '新增模板',
      editModalTitle: '编辑模板',
      nameLabel: '模板名称',
      namePlaceholder: '请输入模板名称',
      descriptionLabel: '描述',
      descriptionPlaceholder: '请输入模板描述',
      categoryPlaceholder: '请输入分类',
      defaultImportanceLabel: '默认重要性',
      defaultImportancePlaceholder: '请选择默认重要性',
      defaultTagsLabel: '默认标签',

      // 消息
      deleteSuccess: '删除成功',
      deleteConfirm: '确定要删除这个模板吗？',
      applied: '已应用模板：{name}',
      use: '使用',
    },

    // 权限管理
    permissions: {
      title: '权限管理',
      addButton: '添加用户',
      description: '权限说明',
      descriptionText: '管理员拥有所有权限，编辑者可以创建、编辑和查看记忆，查看者只能浏览记忆内容。',

      // 列
      colUsername: '用户名',
      colRole: '角色',
      colPermissions: '权限',
      colMemoryCount: '记忆数量',
      colLastAccess: '最后访问',

      // 弹窗
      addModalTitle: '添加记忆库用户',
      usernameLabel: '用户名',
      usernamePlaceholder: '请输入用户名',
      roleLabel: '角色',
      rolePlaceholder: '请选择角色',
      roleAdmin: '管理员',
      roleEditor: '编辑者',
      roleViewer: '查看者',
      permissionsLabel: '权限',
      permissionsPlaceholder: '请选择权限',
      permAll: '全部',
      permCreate: '创建',
      permEdit: '编辑',
      permView: '查看',
      permDelete: '删除',

      // 消息
      removeSuccess: '移除成功',
      removeConfirm: '确定要移除这个用户吗？',
      remove: '移除',
      addSuccess: '添加成功',
    },
  },

  // ==================== 问数管理 ====================
  questioning: {
    title: '问数管理',

    // Tabs
    tabs: {
      databases: '数据源管理',
      glossaries: '行业黑话',
      history: '问数历史',
      ask: '自然语言问数',
    },

    // 数据源管理
    databases: {
      title: '数据源管理',
      addButton: '新增数据源',

      // 列
      name: '数据源名称',
      type: '数据库类型',
      host: '主机地址',
      port: '端口',
      database: '数据库名',
      status: '状态',
      tableCount: '表数量',
      lastSync: '最后同步',
      actions: '操作',

      // 状态
      statusConnected: '已连接',
      statusDisconnected: '未连接',
      statusError: '连接错误',

      // 类型
      typeMySQL: 'MySQL',
      typePostgreSQL: 'PostgreSQL',
      typeOracle: 'Oracle',
      typeSQLServer: 'SQL Server',

      // 弹窗
      addModalTitle: '新增数据源',
      editModalTitle: '编辑数据源',
      nameLabel: '数据源名称',
      typeLabel: '数据库类型',
      hostLabel: '主机地址',
      hostPlaceholder: '例如：192.168.1.100',
      portLabel: '端口',
      databaseLabel: '数据库名',
      usernameLabel: '用户名',
      passwordLabel: '密码',

      // 按钮
      testConnection: '测试连接',
      testConnecting: '正在测试连接...',
      testSuccess: '连接成功',
      testFailed: '连接失败',

      // 提示信息
      alertMessage: '数据源说明',
      alertDescription: '配置和管理数据库连接，支持MySQL、PostgreSQL等主流数据库。系统会自动同步表结构信息用于自然语言转SQL。',

      // 消息
      fetchFailed: '获取数据源列表失败',
      createSuccess: '创建成功',
      createFailed: '创建失败',
      updateSuccess: '更新成功',
      updateFailed: '更新失败',
      deleteSuccess: '删除成功',
      deleteFailed: '删除失败',
      deleteConfirm: '确定要删除这个数据源吗？',
    },

    // 行业黑话
    glossaries: {
      title: '行业黑话/术语',
      addButton: '新增术语',
      searchPlaceholder: '搜索术语',

      // 列
      term: '术语',
      definition: '定义',
      mapping: '映射规则',
      category: '分类',
      example: '示例问句',
      examples: '示例',
      updateTime: '更新时间',
      actions: '操作',

      // 统计
      statsTotal: '术语总数',
      statsSales: '销售指标',
      statsUser: '用户指标',
      statsOther: '其他指标',

      // 分类
      categorySales: '销售指标',
      categoryUser: '用户指标',
      categoryProduct: '产品指标',
      categoryFinance: '财务指标',

      // 弹窗
      addModalTitle: '新增术语',
      editModalTitle: '编辑术语',
      termLabel: '术语',
      termPlaceholder: '例如：GMV、DAU、转化率',
      definitionLabel: '定义',
      definitionPlaceholder: '例如：成交总额、日活跃用户数',
      mappingLabel: '映射规则',
      mappingPlaceholder: '例如：SUM(order_amount)',
      mappingRequired: '请输入SQL映射规则',
      categoryLabel: '分类',
      categoryPlaceholder: '请选择分类',
      exampleLabel: '示例问句',
      examplePlaceholder: '例如：本月GMV是多少',
      exampleRequired: '请输入示例问句',
      examplesLabel: '示例',
      examplesPlaceholder: '每行一个示例',

      // 提示信息
      alertMessage: '行业黑话说明',
      alertDescription: '维护业务术语词典，将行业黑话、业务术语映射到数据库字段和SQL表达式，提高问数理解的准确度。',

      // 消息
      fetchFailed: '获取术语列表失败',
      createSuccess: '创建成功',
      createFailed: '创建失败',
      updateSuccess: '更新成功',
      updateFailed: '更新失败',
      deleteSuccess: '删除成功',
      deleteFailed: '删除失败',
      deleteConfirm: '确定要删除这个术语吗？',
      searchWarning: '请输入搜索关键词',
    },

    // 问数历史
    history: {
      title: '问数历史',

      // 列
      question: '问题',
      sql: '生成的SQL',
      resultCount: '结果数量',
      duration: '耗时(ms)',
      status: '状态',
      database: '数据库',
      confidence: '置信度',
      askTime: '提问时间',
      actions: '操作',

      // 状态
      statusSuccess: '成功',
      statusFailed: '失败',

      // 统计
      statsTotal: '总问数',
      statsToday: '今日问数',
      statsSuccess: '成功',
      statsFailed: '失败',
      avgDuration: '平均耗时',

      // 提示信息
      alertMessage: '历史说明',
      alertDescription: '查看用户的问数历史，包括问句、生成的SQL、执行结果等。可用于分析用户需求、优化术语词典。',

      // 消息
      fetchFailed: '获取历史记录失败',
    },

    // 自然语言问数
    ask: {
      title: '自然语言问数',
      selectDatabase: '选择数据库',
      questionLabel: '问题',
      questionPlaceholder: '请输入问句，例如：本月销售额是多少、Top 10产品...',
      askButton: '生成SQL',
      clearButton: '清空结果',
      executeButton: '执行查询',

      // 示例
      exampleLabel: '示例问句',
      example1: '本月销售额是多少',
      example2: 'Top 10销售产品',
      example3: '最近7天用户增长趋势',
      example4: '各地区GMV排名',

      // 结果
      resultTitle: '生成结果',
      generatedSQL: '生成的SQL',
      confidence: '置信度',
      recognizedTerms: '识别术语',
      explanation: '理解说明',
      duration: '耗时',
      resultCount: '结果数量',

      // 消息
      noDatabase: '请先选择数据库',
      questionRequired: '请输入问句',
      askSuccess: '查询成功',
      askFailed: '生成SQL失败',
    },
  },

  // ==================== 用户管理 ====================
  users: {
    title: '用户管理',

    // 统计
    statsTotal: '总用户数',
    statsActive: '活跃用户',
    statsAdmin: '管理员',
    statsUser: '普通用户',

    // 操作
    addButton: '新增用户',
    searchPlaceholder: '搜索用户名或邮箱',
    roleFilter: '筛选角色',
    statusFilter: '筛选状态',

    // 列
    username: '用户名',
    email: '邮箱',
    role: '角色',
    status: '状态',
    createTime: '创建时间',
    lastLogin: '最后登录',
    actions: '操作',

    // 角色
    roleAdmin: '管理员',
    roleUser: '普通用户',
    roleReadonly: '只读用户',

    // 状态
    statusActive: '启用',
    statusInactive: '禁用',

    // 弹窗
    addModalTitle: '新增用户',
    editModalTitle: '编辑用户',
    usernameLabel: '用户名',
    usernamePlaceholder: '请输入用户名',
    emailLabel: '邮箱',
    emailPlaceholder: '请输入邮箱',
    roleLabel: '角色',
    rolePlaceholder: '请选择角色',
    statusLabel: '状态',
    statusPlaceholder: '请选择状态',

    // 消息
    fetchFailed: '获取用户列表失败',
    createSuccess: '创建成功',
    createFailed: '创建失败',
    updateSuccess: '更新成功',
    updateFailed: '更新失败',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    deleteConfirm: '确定要删除这个用户吗？',
  },

  // ==================== 问答策略 ====================
  strategy: {
    title: '问答策略配置',
    refresh: '刷新',
    saveConfig: '保存配置',

    // 通用消息
    fetchConfigError: '获取配置失败',
    saveConfigSuccess: '配置保存成功',
    saveConfigError: '配置保存失败',
    resetConfigSuccess: '已恢复默认配置',
    resetConfigError: '恢复默认配置失败',

    // 配置说明
    configInfo: {
      title: '配置说明',
      description: '配置问答策略将影响AI回答的质量和风格。修改后需要保存才能生效。',
    },

    // 模型参数
    modelParams: {
      title: '模型参数',
      temperature: {
        label: 'Temperature (温度)',
        tooltip: '控制输出的随机性。值越高输出越随机、越有创意；值越低输出越确定、越一致',
        required: '请输入温度值',
        unit: '',
        marks: {
          deterministic: '确定性',
          balanced: '平衡',
          creative: '创意',
          random: '随机',
        },
      },
      maxTokens: {
        label: '最大Token数',
        tooltip: '限制单次回答的最大长度，1 Token约等于0.75个汉字',
        required: '请输入最大Token数',
        unit: 'tokens',
      },
    },

    // 检索策略
    retrievalStrategy: {
      title: '检索策略',
      topK: {
        label: 'Top-K 文档数量',
        tooltip: '从向量数据库中检索最相关的K个文档作为上下文',
        required: '请输入Top-K值',
        unit: '个',
      },
      similarityThreshold: {
        label: '相似度阈值',
        tooltip: '只返回相似度高于此阈值的文档，范围0-1，值越高要求越严格',
        required: '请输入相似度阈值',
        marks: {
          all: '全部',
          loose: '宽松',
          moderate: '适中',
          strict: '严格',
          precise: '精确',
        },
      },
    },

    // 提示词配置
    promptConfig: {
      title: '提示词配置',
      systemPrompt: {
        label: '系统提示词',
        tooltip: '定义AI助手的角色、任务和回答风格',
        required: '请输入系统提示词',
        placeholder: '例如：你是一个专业的AI助手，负责回答用户关于知识库的问题...',
      },
    },

    // 快捷操作
    quickActions: {
      title: '快捷操作',
      resetDefault: '恢复默认配置',
    },

    // 配置预览
    configPreview: {
      title: '当前配置预览',
      fields: {
        temperature: '温度',
        maxTokens: '最大Token数',
        topK: 'Top-K',
        similarityThreshold: '相似度阈值',
        systemPrompt: '系统提示词',
        notSet: '未设置',
      },
    },

    // Tabs
    tabs: {
      model: '模型参数',
      retrieval: '检索策略',
      prompt: '提示词模板',
      security: '安全设置',
    },

    // 模型
    model: {
      title: '模型参数配置',
      description: '配置AI模型的基本参数',
      temperatureLabel: 'Temperature (温度)',
      temperatureHelp: '控制输出的随机性，值越高输出越随机',
      maxTokensLabel: '最大Token数',
      maxTokensHelp: '限制单次回答的最大长度',
      topPLabel: 'Top P',
      topPHelp: '核采样参数，控制词汇选择范围',
      frequencyPenaltyLabel: '频率惩罚',
      frequencyPenaltyHelp: '降低重复内容的出现概率',
      saveButton: '保存参数',
      resetButton: '重置默认',
      saveSuccess: '参数保存成功',
      saveFailed: '参数保存失败',
    },

    // 检索
    retrieval: {
      title: '检索策略配置',
      description: '配置知识库检索相关参数',
      topKLabel: 'Top-K',
      topKHelp: '返回最相关的K个文档',
      thresholdLabel: '相似度阈值',
      thresholdHelp: '只返回相似度高于此阈值的文档',
      searchModeLabel: '检索模式',
      searchModeHelp: '选择检索算法',
      searchModeSemantic: '语义检索',
      searchModeHybrid: '混合检索',
      searchModeKeyword: '关键词检索',
      saveButton: '保存策略',
      testButton: '测试检索',
      saveSuccess: '策略保存成功',
      saveFailed: '策略保存失败',
    },

    // 提示词模板
    prompt: {
      title: '提示词模板管理',
      description: '自定义系统提示词模板',
      systemPromptLabel: '系统提示词',
      systemPromptHelp: '定义AI助手的角色和行为准则',
      userPromptLabel: '用户提示词模板',
      userPromptHelp: '定义用户输入的处理方式',
      contextPromptLabel: '上下文模板',
      contextHelp: '定义检索到的上下文如何组织',
      saveButton: '保存模板',
      previewButton: '预览效果',
      resetButton: '恢复默认',
      saveSuccess: '模板保存成功',
      saveFailed: '模板保存失败',
    },

    // 安全设置
    security: {
      title: '安全设置',
      description: '配置内容过滤和安全规则',
      enableFilterLabel: '启用敏感词过滤',
      enableFilterHelp: '自动过滤敏感内容',
      customWordsLabel: '自定义敏感词',
      customWordsHelp: '每行一个词，支持正则表达式',
      maxLengthLabel: '回答长度限制',
      maxLengthHelp: '限制单次回答的最大字符数',
      enableAuditLabel: '启用审计日志',
      enableAuditHelp: '记录所有问答内容用于审计',
      saveButton: '保存设置',
      saveSuccess: '设置保存成功',
      saveFailed: '设置保存失败',
    },
  },

  // ==================== 布局组件 ====================
  layout: {
    header: {
      title: 'AIDP Manager',
      welcome: '欢迎，{username}',
    },
    footer: {
      copyright: '© 2026 AIDP Manager. All rights reserved.',
    },
  },
};
