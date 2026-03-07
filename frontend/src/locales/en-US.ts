export default {
  common: {
    // Common Actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    search: 'Search',
    refresh: 'Refresh',
    submit: 'Submit',
    export: 'Export',
    import: 'Import',
    view: 'View',
    back: 'Back',

    // Status
    loading: 'Loading...',
    success: 'Operation successful',
    error: 'Operation failed',
    warning: 'Warning',
    info: 'Information',

    // Pagination
    pagination: {
      total: 'Total {total}',
      pageSize: 'items/page',
    },

    // Form Validation
    validation: {
      required: 'Please enter {field}',
      requiredSelect: 'Please select {field}',
      email: 'Please enter a valid email address',
    },

    // Confirmation Dialogs
    confirmDelete: 'Are you sure you want to delete?',
    confirmAction: 'Are you sure you want to perform this action?',
  },

  // ==================== Sidebar Navigation ====================
  sidebar: {
    dashboard: 'Dashboard',
    knowledge: 'Knowledge Base',
    memory: 'Memory Manager',
    questioning: 'Questioning',
    users: 'User Management',
    strategy: 'QA Strategy',
    logout: 'Logout',
  },

  // ==================== Login Page ====================
  login: {
    title: 'AIDP Manager',
    subtitle: 'AI Data Platform Management System',
    username: 'Username',
    usernamePlaceholder: 'Please enter username',
    password: 'Password',
    passwordPlaceholder: 'Please enter password',
    loginButton: 'Login',
    loggingIn: 'Logging in...',
    loginSuccess: 'Login successful',
    loginFailed: 'Login failed, please check your username and password',
  },

  // ==================== Dashboard ====================
  dashboard: {
    title: 'Dashboard',

    // Statistics Cards
    stats: {
      totalUsers: 'Total Users',
      activeUsers: 'Active Users',
      totalDocuments: 'Documents',
      vectorizedDocs: 'Vectorized',
      todayQuestions: 'Today\'s Questions',
      avgResponseTime: 'Avg Response Time',
    },

    // System Overview
    overview: {
      title: 'System Overview',
      vectorCount: 'Vector Count',
      avgResponseTime: 'Avg Response Time',
      categoryCount: 'Categories',
      successRate: 'Success Rate',
      unit个: '',
      unit条: '',
      unit秒: '',
      unit次: '',
    },

    // Charts
    charts: {
      userGrowth: 'User Growth Trend',
      userGrowthPeriod: 'User Growth (Last 30 Days)',
      questionVolume: 'Question Volume',
      questionVolumePeriod: 'Question Volume (Last 7 Days)',
      categoryDistribution: 'Category Distribution',
      docCount: 'Document Count',
      categoryDist: 'Category Distribution',
      qaStats: 'Q&A Statistics',
      qaStatsPeriod: 'Q&A Statistics (Last 7 Days)',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
    },

    // Quick Actions
    quickActions: {
      addDocument: 'Add Document',
      manageUsers: 'Manage Users',
      settings: 'Settings',
      viewLogs: 'View Logs',
    },

    // Recent Activity
    recentActivity: {
      title: 'Recent Activity',
      userLogin: 'User Login',
      documentCreated: 'Document Created',
      documentUpdated: 'Document Updated',
      questionAsked: 'Question Asked',
    },
  },

  // ==================== Knowledge Base ====================
  knowledge: {
    title: 'Knowledge Base Management',

    // Tabs
    tabs: {
      intro: 'Introduction',
      mappings: 'Directory Mapping',
      files: 'File Management',
    },

    // Introduction
    intro: {
      info: 'Knowledge Base Information',
      name: 'AIDP Manager Knowledge Base',
      nameValue: 'AIDP Manager Knowledge Base',
      createTime: 'Created',
      totalDocs: 'Total Documents',
      indexedDocs: 'Indexed Documents',
      categoryCount: 'Categories',
      vectorDimension: 'Vector Dimension',
      storagePath: 'Storage Path',
      indexStatus: 'Index Status',
      indexStatusNormal: 'Normal',
      description: 'Description',
      descriptionText: 'This knowledge base uses vector retrieval technology to support semantic search. After documents are vectorized, intelligent retrieval can be performed through natural language, and the system will return the most semantically relevant document content.',
      statsTotal: 'Total Documents',
      statsIndexed: 'Indexed',
      statsCategories: 'Categories',
    },

    // Directory Mapping
    mappings: {
      title: 'Directory Mapping Configuration',
      addButton: 'Add Mapping',
      description: 'Directory Mapping Description',
      descriptionText: 'Configure directory tasks for periodic scanning and import. Supports NFS, S3, and local file systems. The system records the time and operator for each import, and import tasks can be triggered manually via the execute button.',

      // Columns
      taskId: 'Task ID',
      directoryName: 'Directory Name',
      directoryPath: 'Directory Path',
      fileSystem: 'File System',
      lastImportTime: 'Last Import Time',
      operator: 'Operator',
      actions: 'Actions',

      // Buttons
      view: 'View',
      execute: 'Execute',
      delete: 'Delete',

      // Modal
      modalTitle: 'Add Directory Mapping',
      directoryNameLabel: 'Directory Name',
      directoryNamePlaceholder: 'e.g., Technical Documents Directory',
      directoryPathLabel: 'Directory Path',
      directoryPathPlaceholder: '/data/documents/tech',
      fileSystemLabel: 'File System',
      fileSystemPlaceholder: 'Please select file system type',
      fileSystemNFS: 'NFS',
      fileSystemS3: 'S3',
      fileSystemLOCAL: 'Local File System',

      // Messages
      executeSuccess: 'Task {id} started',
      deleteSuccess: 'Deleted successfully',
      addSuccess: 'Added successfully',
      deleteConfirm: 'Are you sure you want to delete this mapping task?',
      detailTitle: 'Directory Mapping Details',
    },

    // File Management
    files: {
      title: 'Document List',
      addButton: 'Add Document',
      semanticSearch: 'Semantic Search',
      batchImport: 'Batch Import',
      batchExport: 'Batch Export',
      rebuildIndex: 'Rebuild Index',
      rebuildConfirm: 'Are you sure you want to rebuild the vector index? This may take some time.',
      rebuildSuccess: 'Rebuild complete: {vectorized}/{total} documents',

      // Statistics
      statsTotal: 'Total Documents',
      statsIndexed: 'Indexed',
      statsCategories: 'Categories',
      statsCurrentPage: 'Current Page',

      // Search
      searchPlaceholder: 'Search document title, content, or tags',
      categoryPlaceholder: 'Select category',

      // Columns
      colTitle: 'Title',
      colCategory: 'Category',
      colTags: 'Tags',
      colVectorized: 'Vectorized',
      colIndexed: 'Indexed',
      colNotIndexed: 'Not Indexed',
      colUpdateTime: 'Updated',
      colActions: 'Actions',

      // Modal
      addModalTitle: 'Add Document',
      editModalTitle: 'Edit Document',
      titleLabel: 'Title',
      titlePlaceholder: 'Please enter document title',
      categoryLabel: 'Category',
      modalCategoryPlaceholder: 'Enter or select category',
      categoryHelp: 'You can select from existing categories or enter a new category name',
      tagsLabel: 'Tags',
      tagsPlaceholder: 'Enter tags and press Enter to add',
      contentLabel: 'Content',
      contentPlaceholder: 'Please enter document content',

      // Search Modal
      searchModalTitle: 'Semantic Search',
      searchModalPlaceholder: 'Enter search content, the system will use semantic search to find relevant documents',
      searchResults: 'Search Results',
      similarity: 'Similarity',

      // Messages
      fetchFailed: 'Failed to fetch document list',
      deleteSuccess: 'Deleted successfully',
      deleteFailed: 'Failed to delete',
      deleteConfirm: 'Are you sure you want to delete this document?',
      updateSuccess: 'Updated successfully',
      updateFailed: 'Failed to update',
      createSuccess: 'Created successfully',
      createFailed: 'Failed to create',
      searchWarning: 'Please enter search content',
      searchFailed: 'Search failed',
      indexWarning: 'Please enter search content',
    },
  },

  // ==================== Memory Manager ====================
  memory: {
    title: 'Memory Manager',

    // Tabs
    tabs: {
      list: 'Memory List',
      templates: 'Templates',
      permissions: 'Permissions',
    },

    // Memory List
    list: {
      title: 'Memory List',
      addButton: 'Add Memory',
      quickAdd: 'Quick Add',
      batchImport: 'Batch Import',
      batchExport: 'Batch Export',

      // Search
      searchPlaceholder: 'Search memory title, content or tags',
      typePlaceholder: 'Memory Type',
      categoryPlaceholder: 'Category',
      importancePlaceholder: 'Min Importance',

      // Columns
      colTitle: 'Title',
      colCategory: 'Category',
      colType: 'Type',
      colImportance: 'Importance',
      colAccessCount: 'Access Count',
      colCreateTime: 'Created',
      content: 'Content',
      category: 'Category',
      type: 'Type',
      importance: 'Importance',
      accessCount: 'Access Count',
      lastAccess: 'Last Access',
      updateTime: 'Updated',
      actions: 'Actions',

      // Types
      typeLongTerm: 'Long-term Memory',
      typeShortTerm: 'Short-term Memory',
      typeWorking: 'Working Memory',

      // Modal
      addModalTitle: 'Add Memory',
      editModalTitle: 'Edit Memory',
      quickAddModalTitle: 'Quick Add Memory',
      titleLabel: 'Title',
      titlePlaceholder: 'Please enter memory title',
      contentLabel: 'Content',
      contentPlaceholder: 'Please enter memory content',
      categoryLabel: 'Category',
      categoryHelp: 'Select from existing categories or enter a new category name',
      categorySelectPlaceholder: 'Enter or select category',
      tagsLabel: 'Tags',
      tagsPlaceholder: 'Enter tags and press Enter to add',
      typeLabel: 'Type',
      importanceLabel: 'Importance',

      // Statistics
      statsTotal: 'Total Memories',
      statsCategories: 'Categories',
      statsTypes: 'Types',

      // Messages
      fetchFailed: 'Failed to fetch memory list',
      createSuccess: 'Created successfully',
      createFailed: 'Failed to create',
      updateSuccess: 'Updated successfully',
      updateFailed: 'Failed to update',
      deleteSuccess: 'Deleted successfully',
      deleteFailed: 'Failed to delete',
      deleteConfirm: 'Are you sure you want to delete this memory?',
      accessSuccess: 'Access information updated',
      semanticSearch: 'Semantic Search',
      semanticSearchDeveloping: 'Semantic search feature is under development',
    },

    // Templates
    templates: {
      title: 'Template Management',
      addButton: 'Add Template',
      description: 'Template Description',
      descriptionText: 'Preset memory templates can quickly create specific types of memories, improving recording efficiency. Templates include default category, memory type, importance, and tags.',

      // Columns
      name: 'Template Name',
      colDescription: 'Description',
      fieldCount: 'Field Count',
      lastUsed: 'Last Used',
      actions: 'Actions',
      defaultImportance: 'Default Importance',

      // Modal
      addModalTitle: 'Add Template',
      editModalTitle: 'Edit Template',
      nameLabel: 'Template Name',
      namePlaceholder: 'Please enter template name',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Please enter template description',
      categoryPlaceholder: 'Please enter category',
      defaultImportanceLabel: 'Default Importance',
      defaultImportancePlaceholder: 'Please select default importance',
      defaultTagsLabel: 'Default Tags',

      // Messages
      deleteSuccess: 'Deleted successfully',
      deleteConfirm: 'Are you sure you want to delete this template?',
      applied: 'Template applied: {name}',
      use: 'Use',
    },

    // Permissions
    permissions: {
      title: 'Permission Management',
      addButton: 'Add User',
      description: 'Permission Description',
      descriptionText: 'Administrators have all permissions, editors can create, edit and view memories, viewers can only browse memory content.',

      // Columns
      colUsername: 'Username',
      colRole: 'Role',
      colPermissions: 'Permissions',
      colMemoryCount: 'Memory Count',
      colLastAccess: 'Last Access',

      // Modal
      addModalTitle: 'Add Memory User',
      usernameLabel: 'Username',
      usernamePlaceholder: 'Please enter username',
      roleLabel: 'Role',
      rolePlaceholder: 'Please select role',
      roleAdmin: 'Administrator',
      roleEditor: 'Editor',
      roleViewer: 'Viewer',
      permissionsLabel: 'Permissions',
      permissionsPlaceholder: 'Please select permissions',
      permAll: 'All',
      permCreate: 'Create',
      permEdit: 'Edit',
      permView: 'View',
      permDelete: 'Delete',

      // Messages
      removeSuccess: 'Removed successfully',
      removeConfirm: 'Are you sure you want to remove this user?',
      remove: 'Remove',
      addSuccess: 'Added successfully',
    },
  },

  // ==================== Questioning ====================
  questioning: {
    title: 'Questioning Management',

    // Tabs
    tabs: {
      databases: 'Data Sources',
      glossaries: 'Glossaries',
      history: 'History',
      ask: 'Natural Language Query',
    },

    // Data Sources
    databases: {
      title: 'Data Source Management',
      addButton: 'Add Data Source',

      // Columns
      name: 'Source Name',
      type: 'Database Type',
      host: 'Host',
      port: 'Port',
      database: 'Database',
      status: 'Status',
      tableCount: 'Table Count',
      lastSync: 'Last Sync',
      actions: 'Actions',

      // Status
      statusConnected: 'Connected',
      statusDisconnected: 'Disconnected',
      statusError: 'Connection Error',

      // Types
      typeMySQL: 'MySQL',
      typePostgreSQL: 'PostgreSQL',
      typeOracle: 'Oracle',
      typeSQLServer: 'SQL Server',

      // Modal
      addModalTitle: 'Add Data Source',
      editModalTitle: 'Edit Data Source',
      nameLabel: 'Source Name',
      typeLabel: 'Database Type',
      hostLabel: 'Host',
      hostPlaceholder: 'e.g., 192.168.1.100',
      portLabel: 'Port',
      databaseLabel: 'Database',
      usernameLabel: 'Username',
      passwordLabel: 'Password',

      // Buttons
      testConnection: 'Test Connection',
      testConnecting: 'Testing connection...',
      testSuccess: 'Connection successful',
      testFailed: 'Connection failed',

      // Alerts
      alertMessage: 'Data Source Instructions',
      alertDescription: 'Configure and manage database connections, supporting MySQL, PostgreSQL, and other mainstream databases. The system automatically synchronizes table structure information for natural language to SQL conversion.',

      // Messages
      fetchFailed: 'Failed to fetch data source list',
      createSuccess: 'Created successfully',
      createFailed: 'Failed to create',
      updateSuccess: 'Updated successfully',
      updateFailed: 'Failed to update',
      deleteSuccess: 'Deleted successfully',
      deleteFailed: 'Failed to delete',
      deleteConfirm: 'Are you sure you want to delete this data source?',
    },

    // Glossaries
    glossaries: {
      title: 'Industry Glossary',
      addButton: 'Add Term',
      searchPlaceholder: 'Search terms',

      // Columns
      term: 'Term',
      definition: 'Definition',
      mapping: 'Mapping Rule',
      category: 'Category',
      example: 'Example Question',
      examples: 'Examples',
      updateTime: 'Updated',
      actions: 'Actions',

      // Statistics
      statsTotal: 'Total Terms',
      statsSales: 'Sales Metrics',
      statsUser: 'User Metrics',
      statsOther: 'Other Metrics',

      // Categories
      categorySales: 'Sales Metrics',
      categoryUser: 'User Metrics',
      categoryProduct: 'Product Metrics',
      categoryFinance: 'Finance Metrics',

      // Modal
      addModalTitle: 'Add Term',
      editModalTitle: 'Edit Term',
      termLabel: 'Term',
      termPlaceholder: 'e.g., GMV, DAU, Conversion Rate',
      definitionLabel: 'Definition',
      definitionPlaceholder: 'e.g., Gross Merchandise Value, Daily Active Users',
      mappingLabel: 'Mapping Rule',
      mappingPlaceholder: 'e.g., SUM(order_amount)',
      mappingRequired: 'Please enter SQL mapping rule',
      categoryLabel: 'Category',
      categoryPlaceholder: 'Select category',
      exampleLabel: 'Example Question',
      examplePlaceholder: 'e.g., What is the GMV this month',
      exampleRequired: 'Please enter example question',
      examplesLabel: 'Examples',
      examplesPlaceholder: 'One example per line',

      // Alerts
      alertMessage: 'Glossary Instructions',
      alertDescription: 'Maintain business term dictionary, map industry jargon and business terms to database fields and SQL expressions to improve query accuracy.',

      // Messages
      fetchFailed: 'Failed to fetch term list',
      createSuccess: 'Created successfully',
      createFailed: 'Failed to create',
      updateSuccess: 'Updated successfully',
      updateFailed: 'Failed to update',
      deleteSuccess: 'Deleted successfully',
      deleteFailed: 'Failed to delete',
      deleteConfirm: 'Are you sure you want to delete this term?',
      searchWarning: 'Please enter a search keyword',
    },

    // Query History
    history: {
      title: 'Query History',

      // Columns
      question: 'Question',
      sql: 'Generated SQL',
      resultCount: 'Results',
      duration: 'Duration(ms)',
      status: 'Status',
      database: 'Database',
      confidence: 'Confidence',
      askTime: 'Time',
      actions: 'Actions',

      // Status
      statusSuccess: 'Success',
      statusFailed: 'Failed',

      // Statistics
      statsTotal: 'Total Queries',
      statsToday: 'Today',
      statsSuccess: 'Success',
      statsFailed: 'Failed',
      avgDuration: 'Avg Duration',

      // Alerts
      alertMessage: 'History Instructions',
      alertDescription: 'View query history, including questions, generated SQL, and execution results. Useful for analyzing user needs and optimizing the glossary.',

      // Messages
      fetchFailed: 'Failed to fetch history records',
    },

    // Natural Language Query
    ask: {
      title: 'Natural Language Query',
      selectDatabase: 'Select Database',
      questionLabel: 'Question',
      questionPlaceholder: 'Please enter your question, e.g., What is the sales this month, Top 10 products...',
      askButton: 'Generate SQL',
      clearButton: 'Clear Results',
      executeButton: 'Execute Query',

      // Examples
      exampleLabel: 'Example Questions',
      example1: 'What is the sales this month',
      example2: 'Top 10 selling products',
      example3: 'User growth trend in the last 7 days',
      example4: 'GMV ranking by region',

      // Results
      resultTitle: 'Generated Results',
      generatedSQL: 'Generated SQL',
      confidence: 'Confidence',
      recognizedTerms: 'Recognized Terms',
      explanation: 'Explanation',
      duration: 'Duration',
      resultCount: 'Results',

      // Messages
      noDatabase: 'Please select a database first',
      questionRequired: 'Please enter a question',
      askSuccess: 'Query successful',
      askFailed: 'Failed to generate SQL',
    },
  },

  // ==================== User Management ====================
  users: {
    title: 'User Management',

    // Statistics
    statsTotal: 'Total Users',
    statsActive: 'Active Users',
    statsAdmin: 'Administrators',
    statsUser: 'Regular Users',

    // Actions
    addButton: 'Add User',
    searchPlaceholder: 'Search username or email',
    roleFilter: 'Filter by Role',
    statusFilter: 'Filter by Status',

    // Columns
    username: 'Username',
    email: 'Email',
    role: 'Role',
    status: 'Status',
    createTime: 'Created',
    lastLogin: 'Last Login',
    actions: 'Actions',

    // Roles
    roleAdmin: 'Administrator',
    roleUser: 'User',
    roleReadonly: 'Read-only User',

    // Status
    statusActive: 'Active',
    statusInactive: 'Inactive',

    // Modal
    addModalTitle: 'Add User',
    editModalTitle: 'Edit User',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Please enter username',
    emailLabel: 'Email',
    emailPlaceholder: 'Please enter email',
    roleLabel: 'Role',
    rolePlaceholder: 'Please select role',
    statusLabel: 'Status',
    statusPlaceholder: 'Please select status',

    // Messages
    fetchFailed: 'Failed to fetch user list',
    createSuccess: 'Created successfully',
    createFailed: 'Failed to create',
    updateSuccess: 'Updated successfully',
    updateFailed: 'Failed to update',
    deleteSuccess: 'Deleted successfully',
    deleteFailed: 'Failed to delete',
    deleteConfirm: 'Are you sure you want to delete this user?',
  },

  // ==================== QA Strategy ====================
  strategy: {
    title: 'QA Strategy Configuration',
    refresh: 'Refresh',
    saveConfig: 'Save Configuration',

    // Common Messages
    fetchConfigError: 'Failed to fetch configuration',
    saveConfigSuccess: 'Configuration saved successfully',
    saveConfigError: 'Failed to save configuration',
    resetConfigSuccess: 'Default configuration restored',
    resetConfigError: 'Failed to restore default configuration',

    // Configuration Info
    configInfo: {
      title: 'Configuration Guide',
      description: 'Configuring the QA strategy will affect the quality and style of AI responses. Changes must be saved to take effect.',
    },

    // Model Parameters
    modelParams: {
      title: 'Model Parameters',
      temperature: {
        label: 'Temperature',
        tooltip: 'Controls the randomness of output. Higher values produce more random and creative output; lower values produce more deterministic and consistent output',
        required: 'Please enter temperature value',
        unit: '',
        marks: {
          deterministic: 'Deterministic',
          balanced: 'Balanced',
          creative: 'Creative',
          random: 'Random',
        },
      },
      maxTokens: {
        label: 'Max Tokens',
        tooltip: 'Limits the maximum length of a single response. 1 Token ≈ 0.75 English characters',
        required: 'Please enter max tokens',
        unit: 'tokens',
      },
    },

    // Retrieval Strategy
    retrievalStrategy: {
      title: 'Retrieval Strategy',
      topK: {
        label: 'Top-K Documents',
        tooltip: 'Retrieve the K most relevant documents from the vector database as context',
        required: 'Please enter Top-K value',
        unit: 'docs',
      },
      similarityThreshold: {
        label: 'Similarity Threshold',
        tooltip: 'Only return documents with similarity above this threshold. Range 0-1, higher values are stricter',
        required: 'Please enter similarity threshold',
        marks: {
          all: 'All',
          loose: 'Loose',
          moderate: 'Moderate',
          strict: 'Strict',
          precise: 'Precise',
        },
      },
    },

    // Prompt Configuration
    promptConfig: {
      title: 'Prompt Configuration',
      systemPrompt: {
        label: 'System Prompt',
        tooltip: 'Defines the AI assistant\'s role, tasks, and response style',
        required: 'Please enter system prompt',
        placeholder: 'e.g., You are a professional AI assistant responsible for answering user questions about the knowledge base...',
      },
    },

    // Quick Actions
    quickActions: {
      title: 'Quick Actions',
      resetDefault: 'Reset to Default',
    },

    // Configuration Preview
    configPreview: {
      title: 'Current Configuration',
      fields: {
        temperature: 'Temperature',
        maxTokens: 'Max Tokens',
        topK: 'Top-K',
        similarityThreshold: 'Similarity Threshold',
        systemPrompt: 'System Prompt',
        notSet: 'Not Set',
      },
    },

    // Tabs
    tabs: {
      model: 'Model Parameters',
      retrieval: 'Retrieval Strategy',
      prompt: 'Prompt Templates',
      security: 'Security Settings',
    },

    // Model
    model: {
      title: 'Model Parameters Configuration',
      description: 'Configure basic AI model parameters',
      temperatureLabel: 'Temperature',
      temperatureHelp: 'Control the randomness of output, higher values produce more random output',
      maxTokensLabel: 'Max Tokens',
      maxTokensHelp: 'Limit the maximum length of a single response',
      topPLabel: 'Top P',
      topPHelp: 'Nucleus sampling parameter, controls vocabulary selection range',
      frequencyPenaltyLabel: 'Frequency Penalty',
      frequencyPenaltyHelp: 'Reduce the probability of recurring content',
      saveButton: 'Save Parameters',
      resetButton: 'Reset to Default',
      saveSuccess: 'Parameters saved successfully',
      saveFailed: 'Failed to save parameters',
    },

    // Retrieval
    retrieval: {
      title: 'Retrieval Strategy Configuration',
      description: 'Configure knowledge base retrieval parameters',
      topKLabel: 'Top-K',
      topKHelp: 'Return the K most relevant documents',
      thresholdLabel: 'Similarity Threshold',
      thresholdHelp: 'Only return documents with similarity above this threshold',
      searchModeLabel: 'Search Mode',
      searchModeHelp: 'Select retrieval algorithm',
      searchModeSemantic: 'Semantic Search',
      searchModeHybrid: 'Hybrid Search',
      searchModeKeyword: 'Keyword Search',
      saveButton: 'Save Strategy',
      testButton: 'Test Retrieval',
      saveSuccess: 'Strategy saved successfully',
      saveFailed: 'Failed to save strategy',
    },

    // Prompt Templates
    prompt: {
      title: 'Prompt Template Management',
      description: 'Customize system prompt templates',
      systemPromptLabel: 'System Prompt',
      systemPromptHelp: 'Define the role and behavior guidelines for the AI assistant',
      userPromptLabel: 'User Prompt Template',
      userPromptHelp: 'Define how user input is processed',
      contextPromptLabel: 'Context Template',
      contextHelp: 'Define how retrieved context is organized',
      saveButton: 'Save Templates',
      previewButton: 'Preview',
      resetButton: 'Reset to Default',
      saveSuccess: 'Templates saved successfully',
      saveFailed: 'Failed to save templates',
    },

    // Security Settings
    security: {
      title: 'Security Settings',
      description: 'Configure content filtering and security rules',
      enableFilterLabel: 'Enable Sensitive Word Filter',
      enableFilterHelp: 'Automatically filter sensitive content',
      customWordsLabel: 'Custom Sensitive Words',
      customWordsHelp: 'One word per line, supports regular expressions',
      maxLengthLabel: 'Response Length Limit',
      maxLengthHelp: 'Limit the maximum character count of a single response',
      enableAuditLabel: 'Enable Audit Log',
      enableAuditHelp: 'Record all Q&A content for auditing',
      saveButton: 'Save Settings',
      saveSuccess: 'Settings saved successfully',
      saveFailed: 'Failed to save settings',
    },
  },

  // ==================== Layout Components ====================
  layout: {
    header: {
      title: 'AIDP Manager',
      welcome: 'Welcome, {username}',
    },
    footer: {
      copyright: '© 2026 AIDP Manager. All rights reserved.',
    },
  },
};
