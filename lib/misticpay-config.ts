export interface MisticPayConfig {
  clientId: string
  clientSecret: string
  endpoint: string
}

const CONFIG_KEY = "misticpay_config"

// Fallback in-memory storage quando localStorage não funciona
let inMemoryConfig: MisticPayConfig | null = null

const DEFAULT_CONFIG: MisticPayConfig = {
  clientId: "seu-client-id-aqui",
  clientSecret: "seu-client-secret-aqui",
  endpoint: "https://api.misticpay.com",
}

export function getMisticPayConfig(): MisticPayConfig | null {
  if (inMemoryConfig) {
    return inMemoryConfig
  }

  if (typeof window === "undefined") {
    return null
  }

  try {
    const stored = localStorage.getItem(CONFIG_KEY)

    if (!stored) {
      return DEFAULT_CONFIG
    }

    const config = JSON.parse(stored)
    inMemoryConfig = config
    return config
  } catch (error) {
    console.error("Erro ao carregar configuração da API:", error)
    return DEFAULT_CONFIG
  }
}

export function saveMisticPayConfig(config: MisticPayConfig): void {
  inMemoryConfig = config

  if (typeof window === "undefined") {
    return
  }

  try {
    const jsonString = JSON.stringify(config)
    localStorage.setItem(CONFIG_KEY, jsonString)
  } catch (error) {
    console.error("Erro ao salvar configuração da API (usando in-memory fallback):", error)
  }
}

export function clearMisticPayConfig(): void {
  inMemoryConfig = null
  if (typeof window === "undefined") return
  localStorage.removeItem(CONFIG_KEY)
}
