import type { Messages } from './en'

const id: Messages = {
  auth: {
    signIn: 'Masuk',
    signUp: 'Buat akun',
    email: 'Email',
    password: 'Kata sandi',
    name: 'Nama',
    signInTitle: 'Masuk',
    signUpTitle: 'Buat akun',
    signInDesc: 'Masukkan email dan kata sandi untuk melanjutkan.',
    signUpDesc: 'Gunakan email dan kata sandi untuk membuat akun.',
    alreadyHaveAccount: 'Sudah punya akun?',
    needAccount: 'Butuh akun?',
    createOne: 'Buat satu',
    nameMin: 'Nama harus minimal 2 karakter',
    emailValid: 'Masukkan alamat email yang valid',
    passwordMin: 'Kata sandi harus minimal 8 karakter',
    passwordDesc: 'Minimal 8 karakter.',
    authFailed: 'Autentikasi gagal',
  },
  admin: {
    logOut: 'Keluar',
  },
  common: {
    loading: 'Memuat',
    pageNotFound: 'Halaman tidak ditemukan',
    pageNotFoundDesc:
      'Halaman yang Anda cari tidak ada atau mungkin telah dipindahkan.',
    goHome: 'Ke beranda',
  },
  org: {
    title: 'Organisasi',
    welcome: 'Selamat datang di Pabriq',
    createDesc: 'Beri nama organisasi Anda untuk memulai',
    create: 'Buat Organisasi',
    name: 'Nama Organisasi',
    namePlaceholder: 'Cth. Bengkel Saya',
    nameMin: 'Nama harus minimal 2 karakter',
    nameInvalid: 'Nama organisasi tidak valid',
    creating: 'Membuat...',
    creationFailed: 'Gagal membuat organisasi',
    taken: 'Nama tersebut sudah digunakan. Silakan coba nama organisasi lain.',
    redirecting: 'Mengarahkan...',
  },
  sidebar: {
    dashboard: 'Dasbor',
    orders: 'Pesanan',
    customers: 'Pelanggan',
    products: 'Produk',
    invoices: 'Faktur',
    production: 'Produksi',
    settings: 'Pengaturan',
  },
  dashboard: {
    welcome: 'Selamat datang di ruang kerja Pabriq Anda',
    activeOrders: 'Pesanan Aktif',
    activeOrdersDesc: 'Pesanan yang sedang diproduksi',
    products: 'Produk',
    productsDesc: 'Produk di katalog Anda',
    invoices: 'Faktur',
    invoicesDesc: 'Faktur yang belum dibayar',
  },
}

export default id
