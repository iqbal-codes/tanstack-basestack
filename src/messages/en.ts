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
  admin: {
    logOut: string
  }
  app: {
    title: string
    retry: string
  }
  common: {
    loading: string
    pageNotFound: string
    pageNotFoundDesc: string
    goHome: string
    confirm: string
    cancel: string
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
  }
  breadcrumb: {
    dashboard: string
    customers: string
    createCustomer: string
    editCustomer: string
    products: string
    newProduct: string
    editProduct: string
  }
  status: {
    draft: string
    pending: string
    approved: string
    production: string
    in_delivery: string
    completed: string
    cancelled: string
    active: string
    inactive: string
    paid: string
    overdue: string
    failed: string
  }
  org: {
    title: string
    welcome: string
    createDesc: string
    create: string
    name: string
    namePlaceholder: string
    nameMin: string
    nameInvalid: string
    creating: string
    creationFailed: string
    taken: string
    redirecting: string
  }
  sidebar: {
    dashboard: string
    orders: string
    customers: string
    products: string
    invoices: string
    production: string
    settings: string
  }
  customers: {
    title: string
    createCustomer: string
    editCustomer: string
    name: string
    businessName: string
    email: string
    phone: string
    address: string
    notes: string
    active: string
    inactive: string
    searchPlaceholder: string
    noCustomers: string
    noCustomersDesc: string
    noResults: string
    save: string
    saving: string
    delete: string
    deleteConfirm: string
    customerCreated: string
    customerUpdated: string
    nameRequired: string
  }
  dashboard: {
    welcome: string
    activeOrders: string
    activeOrdersDesc: string
    products: string
    productsDesc: string
    invoices: string
    invoicesDesc: string
  }
  products: {
    title: string
    createTitle: string
    editTitle: string
    name: string
    namePlaceholder: string
    description: string
    descriptionPlaceholder: string
    productionNotes: string
    productionNotesPlaceholder: string
    active: string
    inactive: string
    searchPlaceholder: string
    noProducts: string
    noProductsDesc: string
    noResults: string
    createProduct: string
    updateProduct: string
    created: string
    updated: string
    deleted: string
    deleteConfirm: string
    variant: {
      title: string
      name: string
      namePlaceholder: string
      add: string
      noVariants: string
      attributes: string
    }
    pricing: {
      title: string
      breakpoints: string
      unitPrice: string
      minQuantity: string
      addBreakpoint: string
      noBreakpoints: string
      preview: string
    }
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
  admin: {
    logOut: 'Log out',
  },
  app: {
    title: 'Admin Console',
    retry: 'Retry',
  },
  common: {
    loading: 'Loading',
    pageNotFound: 'Page not found',
    pageNotFoundDesc:
      "The page you're looking for doesn't exist or may have been moved.",
    goHome: 'Go home',
    confirm: 'Confirm',
    cancel: 'Cancel',
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
  },
  breadcrumb: {
    dashboard: 'Dashboard',
    customers: 'Customers',
    createCustomer: 'Create Customer',
    editCustomer: 'Edit Customer',
    products: 'Products',
    newProduct: 'New Product',
    editProduct: 'Edit Product',
  },
  status: {
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Approved',
    production: 'In Production',
    in_delivery: 'In Delivery',
    completed: 'Completed',
    cancelled: 'Cancelled',
    active: 'Active',
    inactive: 'Inactive',
    paid: 'Paid',
    overdue: 'Overdue',
    failed: 'Failed',
  },
  org: {
    title: 'Organizations',
    welcome: 'Welcome to Pabriq',
    createDesc: 'Name your organization to get started',
    create: 'Create Organization',
    name: 'Organization Name',
    namePlaceholder: 'e.g. My Workshop',
    nameMin: 'Name must be at least 2 characters',
    nameInvalid: 'Invalid organization name',
    creating: 'Creating...',
    creationFailed: 'Failed to create organization',
    taken: 'That name is taken. Please try a different organization name.',
    redirecting: 'Redirecting...',
  },
  sidebar: {
    dashboard: 'Dashboard',
    orders: 'Orders',
    customers: 'Customers',
    products: 'Products',
    invoices: 'Invoices',
    production: 'Production',
    settings: 'Settings',
  },
  customers: {
    title: 'Customers',
    createCustomer: 'Create Customer',
    editCustomer: 'Edit Customer',
    name: 'Name',
    businessName: 'Business Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address / Delivery Notes',
    notes: 'Internal Notes',
    active: 'Active',
    inactive: 'Inactive',
    searchPlaceholder: 'Search customers...',
    noCustomers: 'No customers yet',
    noCustomersDesc: 'Add your first customer to start managing orders.',
    noResults: 'No customers match your search',
    save: 'Save',
    saving: 'Saving...',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this customer?',
    customerCreated: 'Customer created successfully',
    customerUpdated: 'Customer updated successfully',
    nameRequired: 'Name is required',
  },
  dashboard: {
    welcome: 'Welcome to your Pabriq workspace',
    activeOrders: 'Active Orders',
    activeOrdersDesc: 'Orders currently in production',
    products: 'Products',
    productsDesc: 'Products in your catalog',
    invoices: 'Invoices',
    invoicesDesc: 'Outstanding invoices',
  },
  products: {
    title: 'Products',
    createTitle: 'New Product',
    editTitle: 'Edit Product',
    name: 'Product Name',
    namePlaceholder: 'e.g. Custom T-Shirt',
    description: 'Description',
    descriptionPlaceholder: 'Describe the product',
    productionNotes: 'Production Notes',
    productionNotesPlaceholder: 'Special instructions for production',
    active: 'Active',
    inactive: 'Inactive',
    searchPlaceholder: 'Search products...',
    noProducts: 'No products yet',
    noProductsDesc: 'Create your first product to start building your catalog.',
    noResults: 'No products match your search',
    createProduct: 'Create Product',
    updateProduct: 'Update Product',
    created: 'Product created successfully',
    updated: 'Product updated successfully',
    deleted: 'Product deleted',
    deleteConfirm: 'Are you sure you want to delete this product?',
    variant: {
      title: 'Variants',
      name: 'Variant Name',
      namePlaceholder: 'e.g. Large',
      add: 'Add Variant',
      noVariants: 'No variants configured',
      attributes: 'Attributes',
    },
    pricing: {
      title: 'Pricing',
      breakpoints: 'Pricing Breakpoints',
      unitPrice: 'Unit Price',
      minQuantity: 'Min. Quantity',
      addBreakpoint: 'Add Breakpoint',
      noBreakpoints: 'No pricing breakpoints configured',
      preview: 'Pricing Preview',
    },
  },
}

export default en
