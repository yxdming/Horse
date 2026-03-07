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

    // Charts
    charts: {
      userGrowth: 'User Growth Trend',
      questionVolume: 'Question Volume',
      categoryDistribution: 'Category Distribution',
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
      searchPlaceholder: 'Search memory content or tags',
      typePlaceholder: 'Memory Type',
      categoryPlaceholder: 'Category',
      importancePlaceholder: 'Min Importance',

      // Columns
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
      contentLabel: 'Content',
      contentPlaceholder: 'Please enter memory content',
      categoryLabel: 'Category',
      tagsLabel: 'Tags',
      tagsPlaceholder: 'Enter tags and press Enter to add',
      typeLabel: 'Type',
      importanceLabel: 'Importance',

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
    },

    // Templates
    templates: {
      title: 'Template Management',
      addButton: 'Add Template',
      description: 'Template Description',
      descriptionText: 'Memory templates help you quickly create structured memory content. Templates define the format and required fields for memories.',

      // Columns
      name: 'Template Name',
      colDescription: 'Description',
      fieldCount: 'Field Count',
      lastUsed: 'Last Used',
      actions: 'Actions',

      // Messages
      deleteSuccess: 'Deleted successfully',
      deleteConfirm: 'Are you sure you want to delete this template?',
    },

    // Permissions
    permissions: {
      title: 'Permission Management',
      description: 'Permission Description',
      descriptionText: 'Configure user access permissions for the memory library. Administrators can manage all memories, while regular users can only manage their own memories.',
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
      portLabel: 'Port',
      databaseLabel: 'Database',
      usernameLabel: 'Username',
      passwordLabel: 'Password',

      // Buttons
      testConnection: 'Test Connection',
      testSuccess: 'Connection successful',
      testFailed: 'Connection failed',

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
      category: 'Category',
      examples: 'Examples',
      updateTime: 'Updated',
      actions: 'Actions',

      // Modal
      addModalTitle: 'Add Term',
      editModalTitle: 'Edit Term',
      termLabel: 'Term',
      definitionLabel: 'Definition',
      categoryLabel: 'Category',
      examplesLabel: 'Examples',
      examplesPlaceholder: 'One example per line',

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
      duration: 'Duration',
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
    },

    // Natural Language Query
    ask: {
      title: 'Natural Language Query',
      selectDatabase: 'Select Database',
      questionLabel: 'Question',
      questionPlaceholder: 'Please enter your question, e.g., Query user growth trend in the last 7 days',
      askButton: 'Ask',
      clearButton: 'Clear',

      // Results
      resultTitle: 'Query Results',
      generatedSQL: 'Generated SQL',
      confidence: 'Confidence',
      duration: 'Duration',
      resultCount: 'Results',

      // Messages
      noDatabase: 'Please select a database first',
      questionRequired: 'Please enter a question',
      askSuccess: 'Query successful',
      askFailed: 'Query failed',
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

    // Tabs
    tabs: {
      model: 'Model Parameters',
      retrieval: 'Retrieval Strategy',
      prompt: 'Prompt Templates',
      security: 'Security Settings',
    },

    // Model Parameters
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

    // Retrieval Strategy
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
