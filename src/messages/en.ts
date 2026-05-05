export type Messages = {
  auth: {
    signIn: string
    signUp: string
    email: string
    password: string
    name: string
    signInTitle: string
    signUpTitle: string
    signInDesc: string
    signUpDesc: string
    alreadyHaveAccount: string
    needAccount: string
    createOne: string
    nameMin: string
    emailValid: string
    passwordMin: string
    passwordDesc: string
    authFailed: string
  }
  app: {
    title: string
    retry: string
    language: string
    english: string
    indonesian: string
  }
  assetUpload: {
    dropzone: {
      title: string
      hint: string
    }
    actions: {
      browse: string
      remove: string
      retry: string
      undo: string
    }
    states: {
      uploading: string
      processing: string
      failed: string
      done: string
    }
    errors: {
      tooLarge: string
      wrongType: string
      uploadFailed: string
      limitReached: string
      serverError: string
    }
    hints: {
      acceptedFormats: string
      maxSize: string
    }
  }
  common: {
    back: string
    loading: string
    close: string
    pageNotFound: string
    pageNotFoundDesc: string
    goHome: string
    confirm: string
    cancel: string
    preview: string
    actions: string
  }
  dataTable: {
    clearFilters: string
    columnVisibility: string
    errorRetry: string
    errorTitle: string
    firstPage: string
    lastPage: string
    nextPage: string
    of: string
    page: string
    perPage: string
    previousPage: string
    resetColumns: string
    rowsSelected: string
    visibleRows: string
    loading: string
    filterAll: string
    filters: string
    applyFilters: string
    cancelFilters: string
    activeFilters: string
  }
  combobox: {
    searchPlaceholder: string
    noResults: string
    loading: string
  }
  breadcrumb: {
    dashboard: string
    new: string
    edit: string
    detail: string
  }
  status: {
    draft: string
    pending: string
    approved: string
    completed: string
    cancelled: string
    rejected: string
    active: string
    inactive: string
    paid: string
    overdue: string
    failed: string
  }
  sidebar: {
    dashboard: string
  }
}

const en: Messages = {
  auth: {
    signIn: 'Sign in',
    signUp: 'Create an account',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    signInTitle: 'Sign in',
    signUpTitle: 'Create an account',
    signInDesc: 'Enter your email and password to continue.',
    signUpDesc: 'Use email and password to create your account.',
    alreadyHaveAccount: 'Already have an account?',
    needAccount: 'Need an account?',
    createOne: 'Create one',
    nameMin: 'Name must be at least 2 characters',
    emailValid: 'Enter a valid email address',
    passwordMin: 'Password must be at least 8 characters',
    passwordDesc: 'Minimum 8 characters.',
    authFailed: 'Authentication failed',
  },
  app: {
    title: 'Admin Console',
    retry: 'Retry',
    language: 'Language',
    english: 'English',
    indonesian: 'Indonesian',
  },
  assetUpload: {
    dropzone: {
      title: 'Drop files here',
      hint: 'or click to browse',
    },
    actions: {
      browse: 'Browse files',
      remove: 'Remove',
      retry: 'Retry',
      undo: 'Undo',
    },
    states: {
      uploading: 'Uploading...',
      processing: 'Processing...',
      failed: 'Failed',
      done: 'Done',
    },
    errors: {
      tooLarge: 'File is too large',
      wrongType: 'File type not supported',
      uploadFailed: 'Upload failed',
      limitReached: 'Maximum files reached',
      serverError: 'Server error',
    },
    hints: {
      acceptedFormats: 'PNG, JPG, WebP up to {size}',
      maxSize: 'Max {size}',
    },
  },
  common: {
    back: 'Back',
    loading: 'Loading',
    close: 'Close',
    pageNotFound: 'Page not found',
    pageNotFoundDesc:
      "The page you're looking for doesn't exist or may have been moved.",
    goHome: 'Go home',
    confirm: 'Confirm',
    cancel: 'Cancel',
    preview: 'Preview',
    actions: 'Actions',
  },
  dataTable: {
    clearFilters: 'Clear filters',
    columnVisibility: 'Columns',
    errorRetry: 'Retry',
    errorTitle: 'Something went wrong',
    firstPage: 'First page',
    lastPage: 'Last page',
    nextPage: 'Next page',
    of: 'of',
    page: 'Page',
    perPage: 'Per page',
    previousPage: 'Previous page',
    resetColumns: 'Reset columns',
    rowsSelected: '{selected} of {total} selected',
    visibleRows: '{from}-{to} of {total}',
    loading: 'Loading',
    filterAll: 'All',
    filters: 'Filters',
    applyFilters: 'Apply',
    cancelFilters: 'Cancel',
    activeFilters: 'Active filters',
  },
  combobox: {
    searchPlaceholder: 'Search...',
    noResults: 'No results found',
    loading: 'Searching...',
  },
  breadcrumb: {
    dashboard: 'Dashboard',
    new: 'New',
    edit: 'Edit',
    detail: 'Detail',
  },
  status: {
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Approved',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
    active: 'Active',
    inactive: 'Inactive',
    paid: 'Paid',
    overdue: 'Overdue',
    failed: 'Failed',
  },
  sidebar: {
    dashboard: 'Dashboard',
  },
}

export default en
