export interface User {
  id: string
  name: string
  email: string
  password: string
  role: "admin" | "user"
  createdAt: string
  balance: number
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, role: "admin" | "user") => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

// Funções de autenticação usando localStorage
export const getUsers = (): User[] => {
  if (typeof window === "undefined") return []
  const usersData = localStorage.getItem("e18pix_users")
  return usersData ? JSON.parse(usersData) : []
}

export const saveUsers = (users: User[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("e18pix_users", JSON.stringify(users))
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null
  const userData = localStorage.getItem("e18pix_current_user")
  return userData ? JSON.parse(userData) : null
}

export const setCurrentUser = (user: User | null): void => {
  if (typeof window === "undefined") return
  if (user) {
    localStorage.setItem("e18pix_current_user", JSON.stringify(user))
  } else {
    localStorage.removeItem("e18pix_current_user")
  }
}

export const registerUser = (
  name: string,
  email: string,
  password: string,
  role: "admin" | "user" = "user",
): boolean => {
  const users = getUsers()

  // Verifica se o email já está cadastrado
  if (users.some((u) => u.email === email)) {
    return false
  }

  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    email,
    password, // Em produção, usar hash de senha (bcrypt, etc)
    role,
    createdAt: new Date().toISOString(),
    balance: 100.0, // Saldo inicial de R$ 100,00
  }

  users.push(newUser)
  saveUsers(users)
  return true
}

const ADMIN_PASSWORD = "243025"

export const loginUser = (email: string, password: string): User | null => {
  const users = getUsers()

  if (!email) {
    // Verifica se a senha é a senha administrativa
    if (password === ADMIN_PASSWORD) {
      // Busca qualquer usuário admin ou cria um admin padrão
      let adminUser = users.find((u) => u.role === "admin")

      if (!adminUser) {
        // Cria um admin padrão se não existir
        adminUser = {
          id: "admin-default",
          name: "Administrador",
          email: "admin@e18pix.com",
          password: ADMIN_PASSWORD,
          role: "admin",
          createdAt: new Date().toISOString(),
          balance: 0,
        }
        users.push(adminUser)
        saveUsers(users)
      }

      setCurrentUser(adminUser)
      return adminUser
    }
    return null
  }

  // Login normal com email e senha
  const user = users.find((u) => u.email === email && u.password === password)

  if (user) {
    setCurrentUser(user)
    return user
  }

  return null
}

export const logoutUser = (): void => {
  setCurrentUser(null)
}

export const isUserAdmin = (user: User | null): boolean => {
  return user?.role === "admin"
}

export const updateUserBalance = (userId: string, newBalance: number): boolean => {
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex === -1) return false

  users[userIndex].balance = newBalance
  saveUsers(users)

  // Atualiza o usuário atual se for o mesmo
  const currentUser = getCurrentUser()
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(users[userIndex])
  }

  return true
}

export const deleteUser = (userId: string): boolean => {
  const users = getUsers()
  const filteredUsers = users.filter((u) => u.id !== userId)

  if (filteredUsers.length === users.length) return false

  saveUsers(filteredUsers)
  return true
}

export const updateUser = (userId: string, updates: Partial<User>): boolean => {
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex === -1) return false

  users[userIndex] = { ...users[userIndex], ...updates }
  saveUsers(users)

  // Atualiza o usuário atual se for o mesmo
  const currentUser = getCurrentUser()
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(users[userIndex])
  }

  return true
}
