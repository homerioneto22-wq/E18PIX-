"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Transaction } from "@/app/page"
import { createPixTransfer } from "@/lib/misticpay-api"
import { getMisticPayConfig } from "@/lib/misticpay-config"

interface PixTransferFormProps {
  balance: number
  onTransfer: (pixKey: string, pixType: string, amount: number, success: boolean, fee?: number) => void
  onShowReceipt?: (receipt: Transaction) => void
}

const pixKeyTypes = [
  { value: "email", label: "E-mail", placeholder: "exemplo@email.com" },
  { value: "phone", label: "Telefone", placeholder: "(00) 00000-0000 ou 00000000000" },
]

export function PixTransferForm({ balance, onTransfer, onShowReceipt }: PixTransferFormProps) {
  const [pixType, setPixType] = useState("email")
  const [pixKey, setPixKey] = useState("")
  const [amount, setAmount] = useState("")
  const [displayAmount, setDisplayAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const currentPixType = pixKeyTypes.find((t) => t.value === pixType)!

  const config = getMisticPayConfig()
  const isConfigured =
    config &&
    config.clientId &&
    config.clientSecret &&
    !config.clientId.includes("seu-client") &&
    !config.clientId.includes("aqui") &&
    config.clientId.length > 10

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConfigured) {
      toast({
        title: "⚠️ Configuração Necessária",
        description: "Configure Client ID e Secret no painel admin primeiro (senha: 243025)",
        variant: "destructive",
      })
      return
    }

    if (!pixKey || !amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    const cleanPixKey = pixKey.trim().replace(/\D/g, "")

    if (pixType === "phone" && (cleanPixKey.length < 10 || cleanPixKey.length > 11)) {
      toast({
        title: "Telefone inválido",
        description: "O telefone deve ter 10 ou 11 dígitos",
        variant: "destructive",
      })
      return
    }

    if (pixType === "email" && !pixKey.includes("@")) {
      toast({
        title: "Email inválido",
        description: "Digite um endereço de email válido",
        variant: "destructive",
      })
      return
    }

    if (pixKey.trim().length < 3) {
      toast({
        title: "Chave Pix inválida",
        description: "A chave Pix é muito curta",
        variant: "destructive",
      })
      return
    }

    const numAmount = Number.parseFloat(amount)

    if (numAmount <= 0 || isNaN(numAmount)) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior que zero",
        variant: "destructive",
      })
      return
    }

    if (numAmount > balance) {
      toast({
        title: "Saldo insuficiente",
        description: `Saldo disponível: R$ ${balance.toFixed(2).replace(".", ",")}. Você está tentando transferir R$ ${numAmount.toFixed(2).replace(".", ",")}. Reduza o valor ou adicione saldo.`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const result = await createPixTransfer({
      pixKey,
      pixType: currentPixType.value,
      amount: numAmount,
    })

    setLoading(false)

    if (result.success) {
      const fee = numAmount * 0.1
      const amountToDebit = numAmount

      onTransfer(pixKey, currentPixType.label, amountToDebit, true, fee)

      if (onShowReceipt) {
        onShowReceipt({
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toLocaleString("pt-BR"),
          pixKey,
          pixType: currentPixType.label,
          amount: numAmount,
          fee,
          status: "concluída",
          type: "transfer",
        })
      }

      setPixKey("")
      setAmount("")
      setDisplayAmount("")
    } else {
      const isCredenciaisInvalidas =
        result.message?.toLowerCase().includes("credenciais") ||
        result.error === "MISSING_CREDENTIALS" ||
        result.error === "INVALID_CREDENTIALS"

      const isIpNaoAutorizado =
        result.message?.toLowerCase().includes("ip não autorizado") ||
        result.message?.toLowerCase().includes("ip não está na lista") ||
        result.error === "UNAUTHORIZED"

      const isSaldoInsuficiente =
        result.message?.toLowerCase().includes("saldo insuficiente") || result.error === "INSUFFICIENT_BALANCE"

      const errorDetails = (result as any).statusCode ? ` (HTTP ${(result as any).statusCode})` : ""

      let errorTitle = "❌ Erro na Transferência"
      let errorMessage = result.message + errorDetails

      if (isCredenciaisInvalidas) {
        errorTitle = "⚠️ Configuração Necessária"
      } else if (isIpNaoAutorizado) {
        errorTitle = "🔒 IP Não Autorizado"
      } else if (isSaldoInsuficiente) {
        errorTitle = "💰 Saldo Insuficiente na MisticPay"
        errorMessage = result.message + ". Adicione saldo na sua conta MisticPay para continuar."
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handlePixKeyChange = (value: string) => {
    if (pixType === "phone") {
      setPixKey(formatPhone(value))
    } else {
      setPixKey(value)
    }
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "")

    if (!numbers) {
      setAmount("")
      setDisplayAmount("")
      return
    }

    const numValue = Number.parseInt(numbers) / 100

    setAmount(numValue.toString())

    const formatted = numValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    setDisplayAmount(formatted)
  }

  return (
    <>
      <Card className="p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
        <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">Nova Transferência Pix</h2>

        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            Use uma chave Pix válida e cadastrada. Apenas E-mail e Telefone são aceitos.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <Label className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 block">Tipo de Chave Pix</Label>
            <Select
              value={pixType}
              onValueChange={(value) => {
                setPixType(value)
                setPixKey("")
              }}
            >
              <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder="Selecione o tipo de chave" />
              </SelectTrigger>
              <SelectContent>
                {pixKeyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pixKey" className="text-sm sm:text-base font-semibold">
              Chave Pix ({currentPixType.label})
            </Label>
            <Input
              id="pixKey"
              value={pixKey}
              onChange={(e) => handlePixKeyChange(e.target.value)}
              placeholder={currentPixType.placeholder}
              className="h-10 sm:h-12 text-sm sm:text-base mt-2"
            />
          </div>

          <div>
            <Label htmlFor="amount" className="text-sm sm:text-base font-semibold">
              Valor (R$)
            </Label>
            <Input
              id="amount"
              type="text"
              value={displayAmount}
              onChange={(e) => formatCurrency(e.target.value)}
              placeholder="0,00"
              className="h-10 sm:h-12 text-sm sm:text-base mt-2"
            />
          </div>

          <Button type="submit" className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold" disabled={loading}>
            {loading ? "Processando..." : "Transferir"}
          </Button>
        </form>
      </Card>
      <Toaster />
    </>
  )
}

function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, "")

  if (numbers.length <= 11) {
    let formatted = numbers

    if (numbers.length > 2) {
      formatted = "(" + numbers.slice(0, 2) + ") " + numbers.slice(2)
    }
    if (numbers.length > 7) {
      formatted = "(" + numbers.slice(0, 2) + ") " + numbers.slice(2, 7) + "-" + numbers.slice(7, 11)
    }

    return formatted
  }

  return value
}
