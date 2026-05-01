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
  common: {
    loading: string
    pageNotFound: string
    pageNotFoundDesc: string
    goHome: string
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
  dashboard: {
    welcome: string
    activeOrders: string
    activeOrdersDesc: string
    products: string
    productsDesc: string
    invoices: string
    invoicesDesc: string
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
  common: {
    loading: 'Loading',
    pageNotFound: 'Page not found',
    pageNotFoundDesc:
      "The page you're looking for doesn't exist or may have been moved.",
    goHome: 'Go home',
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
  dashboard: {
    welcome: 'Welcome to your Pabriq workspace',
    activeOrders: 'Active Orders',
    activeOrdersDesc: 'Orders currently in production',
    products: 'Products',
    productsDesc: 'Products in your catalog',
    invoices: 'Invoices',
    invoicesDesc: 'Outstanding invoices',
  },
}

export default en
