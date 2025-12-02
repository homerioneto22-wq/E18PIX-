"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { getMisticPayConfig, saveMisticPayConfig, type MisticPayConfig } from "@/lib/misticpay-config"

interface AdminPanelProps {
  balance: number
  setBalance: (balance: number | ((prev: number) => number)) => void
  onClose: () => void
  onAuthenticate?: (isAuthenticated: boolean) => void
}

export function AdminPanel({ balance, setBalance, onClose, onAuthenticate }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [adjustAmount, setAdjustAmount] = useState("")
  const [apiConfig, setApiConfig] = useState<MisticPayConfig>({
    clientId: "seu-client-id-aqui",
    clientSecret: "seu-client-secret-aqui",
    endpoint: "https://api.misticpay.com",
  })
  const [showClientSecret, setShowClientSecret] = useState(false)
  const [isApiConfigured, setIsApiConfigured] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean
    success: boolean
    message: string
  } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isAuthenticated) {
      const savedConfig = getMisticPayConfig()
      if (savedConfig) {
        setApiConfig(savedConfig)
        setIsApiConfigured(
          savedConfig.clientId !== "seu-client-id-aqui" && 
          savedConfig.clientSecret !== "seu-client-secret-aqui"
        )
      }
    }
  }, [isAuthenticated])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "243025") {
      setIsAuthenticated(true)
      onAuthenticate?.(true)
      toast({
        title: "Acesso concedido",
        description: "Bem-vindo ao painel administrativo",
      })
    } else {
      toast({
        title: "Senha incorreta",
        description: "Tente novamente",
        variant: "destructive",
      })
    }
  }

  const handleAdjustBalance = (operation: "add" | "remove") => {
    const amount = Number.parseFloat(adjustAmount)

    if (amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior que zero",
        variant: "destructive",
      })
      return
    }

    if (operation === "add") {
      setBalance((prev) => prev + amount)
      toast({
        title: "Saldo adicionado",
        description: `R$ ${amount.toFixed(2)} adicionado ao saldo`,
      })
    } else {
      if (amount > balance) {
        toast({
          title: "Erro",
          description: "Valor maior que o saldo disponível",
          variant: "destructive",
        })
        return
      }
      setBalance((prev) => prev - amount)
      toast({
        title: "Saldo removido",
        description: `R$ ${amount.toFixed(2)} removido do saldo`,
      })
    }
    setAdjustAmount("")
  }

  const handleSaveApiConfig = () => {
    if (!apiConfig.clientId || !apiConfig.clientSecret) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Client ID e Client Secret",
        variant: "destructive",
      })
      return
    }

    if (!apiConfig.endpoint.startsWith("http://") && !apiConfig.endpoint.startsWith("https://")) {
      toast({
        title: "Endpoint inválido",
        description: "O endpoint deve começar com http:// ou https://",
        variant: "destructive",
      })
      return
    }

    saveMisticPayConfig(apiConfig)
    setIsApiConfigured(true)

    toast({
      title: "✅ Configuração salva com sucesso!",
      description: "A API MisticPay está pronta para uso",
    })
  }

  const testConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus(null)

    if (!apiConfig.clientId || !apiConfig.clientSecret) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: "Configure Client ID e Secret primeiro"
      })
      setTestingConnection(false)
      return
    }

    if (
      apiConfig.clientId.includes("seu-client") || 
      apiConfig.clientId.includes("aqui") ||
      apiConfig.clientId.length < 10
    ) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: "Credenciais ainda são placeholders. Configure credenciais reais."
      })
      setTestingConnection(false)
      return
    }

    try {
      const response = await fetch("/api/pix-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixKey: "00000000000",
          pixType: "cpf",
          amount: 0.01,
          clientId: apiConfig.clientId,
          clientSecret: apiConfig.clientSecret,
          endpoint: apiConfig.endpoint,
          testMode: true
        }),
      })

      const data = await response.json()

      if (response.status === 401 && data.message?.includes("IP não autorizado")) {
        const ipMatch = data.message.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/)
        const detectedIp = ipMatch ? ipMatch[1] : "desconhecido"
        
        setConnectionStatus({
          tested: true,
          success: false,
          message: `⚠️ IP não autorizado: ${detectedIp}\n\nEste é o IP real do servidor. Para resolver:\n1. Acesse o painel da MisticPay\n2. Adicione o IP ${detectedIp} à lista de IPs permitidos\n3. Teste a conexão novamente`
        })
        setTestingConnection(false)
        return
      }

      if (response.ok || (response.status === 400 && data.message?.includes("Saldo insuficiente"))) {
        setConnectionStatus({
          tested: true,
          success: true,
          message: `✅ Conexão OK! ${data.message || "Credenciais válidas e API respondendo."}`
        })
      } else if (response.status === 401) {
        setConnectionStatus({
          tested: true,
          success: false,
          message: "❌ Erro 401: Credenciais inválidas. Verifique Client ID e Secret."
        })
      } else if (response.status === 403) {
        setConnectionStatus({
          tested: true,
          success: false,
          message: `❌ Erro 403: ${data.message || "Acesso negado. Verifique permissões."}`
        })
      } else {
        setConnectionStatus({
          tested: true,
          success: false,
          message: `❌ Erro ${response.status}: ${data.message || "Erro desconhecido"}`
        })
      }
    } catch (error: any) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: `❌ Erro de conexão: ${error.message}`
      })
    }

    setTestingConnection(false)
  }

  const handleClose = () => {
    onAuthenticate?.(false)
    onClose()
  }

  if (!isAuthenticated) {
    return (
      <Card className="p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Painel Administrativo</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="adminPassword">Senha do Administrador</Label>
            <Input
              id="adminPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              className="mt-2"
            />
          </div>
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </Card>
    )
  }

  return (
    <Card className="p-6 mb-6 shadow-lg border-2 border-green-200 dark:border-green-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Painel Administrativo</h2>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-6">
        <div className="border-b pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Configuração API MisticPay</h3>
            {isApiConfigured && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Configurado</span>
              </div>
            )}
          </div>

          {isApiConfigured && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-green-900 dark:text-green-100">API Configurada e Pronta</p>
                  <p className="text-green-800 dark:text-green-200">
                    As credenciais da MisticPay foram salvas. O sistema está pronto para processar transferências e
                    gerar QR codes Pix.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="text-sm space-y-2">
              <p className="font-semibold text-blue-900 dark:text-blue-100">🔧 Configuração Pré-definida</p>
              <p className="text-blue-800 dark:text-blue-200">
                O sistema já vem com valores padrão configurados. Substitua pelos seus dados reais da MisticPay.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                type="text"
                value={apiConfig.clientId}
                onChange={(e) => setApiConfig({ ...apiConfig, clientId: e.target.value })}
                placeholder="Digite o Client ID"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="clientSecret">Client Secret</Label>
              <div className="relative mt-2">
                <Input
                  id="clientSecret"
                  type={showClientSecret ? "text" : "password"}
                  value={apiConfig.clientSecret}
                  onChange={(e) => setApiConfig({ ...apiConfig, clientSecret: e.target.value })}
                  placeholder="Digite o Client Secret"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                >
                  {showClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="endpoint">Endpoint da API</Label>
              <Input
                id="endpoint"
                type="text"
                value={apiConfig.endpoint}
                onChange={(e) => setApiConfig({ ...apiConfig, endpoint: e.target.value })}
                placeholder="https://api.misticpay.com"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Endpoint base da API MisticPay</p>
            </div>

            <Button onClick={handleSaveApiConfig} className="w-full">
              {isApiConfigured ? "Atualizar Configuração" : "Salvar Configuração da API"}
            </Button>

            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={testingConnection}
                className="w-full mb-3"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando conexão...
                  </>
                ) : (
                  "🔍 Testar Conexão com API MisticPay"
                )}
              </Button>

              {connectionStatus && (
                <div className={connectionStatus.success 
                  ? "p-4 rounded-lg border bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" 
                  : "p-4 rounded-lg border bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                }>
                  <div className="flex items-start gap-3">
                    {connectionStatus.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={connectionStatus.success 
                      ? "text-sm font-medium whitespace-pre-line text-green-800 dark:text-green-200" 
                      : "text-sm font-medium whitespace-pre-line text-red-800 dark:text-red-200"
                    }>
                      {connectionStatus.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Gerenciar Saldo Local</h3>
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg mb-4">
            <p className="text-sm text-muted-foreground">Saldo Atual</p>
            <p className="text-2xl font-bold">R$ {balance.toFixed(2).replace(".", ",")}</p>
          </div>

          <div>
            <Label htmlFor="adjustAmount">Ajustar Saldo</Label>
            <Input
              id="adjustAmount"
              type="number"
              step="0.01"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="Digite o valor"
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button onClick={() => handleAdjustBalance("add")} variant="default">
              Adicionar Saldo
            </Button>
            <Button onClick={() => handleAdjustBalance("remove")} variant="destructive">
              Remover Saldo
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
