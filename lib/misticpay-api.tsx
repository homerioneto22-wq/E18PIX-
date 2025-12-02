import { getMisticPayConfig } from "./misticpay-config"

export interface PixTransferRequest {
  pixKey: string
  pixType: string
  amount: number
  description?: string
}

export interface PixTransferResponse {
  success: boolean
  transactionId?: string
  transactionFee?: number
  transactionAmount?: number
  message: string
  error?: string
}

export async function createPixTransfer(request: PixTransferRequest): Promise<PixTransferResponse> {
  const config = getMisticPayConfig()

  if (!config || !config.clientId || !config.clientSecret) {
    return {
      success: false,
      message: "Configuração da API não encontrada. Configure no painel administrativo.",
      error: "MISSING_CONFIG",
    }
  }

  try {
    const response = await fetch("/api/pix-transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pixKey: request.pixKey,
        pixType: request.pixType,
        amount: request.amount,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        endpoint: config.endpoint,
      }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com a API: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      error: "NETWORK_ERROR",
    }
  }
}

export interface PixChargeResponse {
  success: boolean
  qrCode?: string
  pixCopyPaste?: string
  chargeId?: string
  message: string
  error?: string
}

export async function createPixCharge(amount: number): Promise<PixChargeResponse> {
  const config = getMisticPayConfig()

  if (!config || !config.clientId || !config.clientSecret) {
    return {
      success: false,
      message: "Configuração da API não encontrada. Configure no painel administrativo.",
      error: "MISSING_CONFIG",
    }
  }

  try {
    const response = await fetch("/api/pix-charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        endpoint: config.endpoint,
      }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com a API: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      error: "NETWORK_ERROR",
    }
  }
}

export interface BalanceResponse {
  success: boolean
  balance?: number
  message: string
  error?: string
}

export async function getBalance(): Promise<BalanceResponse> {
  try {
    const response = await fetch("/api/balance", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      message: `Erro ao consultar saldo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      error: "NETWORK_ERROR",
    }
  }
}

export async function updateBalance(balance: number): Promise<BalanceResponse> {
  try {
    const response = await fetch("/api/balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ balance }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      message: `Erro ao atualizar saldo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      error: "NETWORK_ERROR",
    }
  }
}

export interface PaymentStatusResponse {
  success: boolean
  status?: string
  paid?: boolean
  message: string
  error?: string
}

export async function checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
  const config = getMisticPayConfig()

  if (!config || !config.clientId || !config.clientSecret) {
    return {
      success: false,
      message: "Configuração da API não encontrada.",
      error: "MISSING_CONFIG",
    }
  }

  try {
    const response = await fetch("/api/check-payment-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transactionId,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        endpoint: config.endpoint,
      }),
    })

    if (!response.ok) {
      return {
        success: false,
        message: `Erro HTTP ${response.status}`,
        error: "API_ERROR",
      }
    }

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      message: `Erro ao verificar pagamento: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      error: "NETWORK_ERROR",
    }
  }
}
