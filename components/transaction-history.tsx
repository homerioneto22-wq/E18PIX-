"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CheckCircle2, Copy, Loader2, Clock, XCircle, Trash2, FileText, AlertCircle } from "lucide-react"
import Image from "next/image"
import { getMisticPayConfig } from "@/lib/misticpay-config"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Transaction } from "@/app/page"
import type { TransactionHistoryProps } from "./transaction-history-props"

export function TransactionHistory({
  transactions,
  onClearHistory,
  isAdmin,
  onUpdateTransactionStatus,
  onCreatePendingTransaction,
  onShowReceipt,
}: TransactionHistoryProps) {
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<{
    qrcode: string
    copyPaste: string
    amount: number
    fee: number
    originalAmount: number
    chargeId?: string
  } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [awaitingTransactionId, setAwaitingTransactionId] = useState<string | null>(null)
  const [pollingStatus, setPollingStatus] = useState<"checking" | "timeout" | "completed" | "idle">("idle")
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedTransactionForQr, setSelectedTransactionForQr] = useState<Transaction | null>(null)

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const isTransactionOverdue = (createdAt: number): boolean => {
    const daysSinceCreation = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24))
    return daysSinceCreation > 30
  }

  const getTransactionTimestamp = (dateStr: string): number => {
    try {
      // Remove "às" e vírgula, esperando formato: "DD/MM/YYYY HH:mm:ss" ou "DD/MM/YYYY, HH:mm:ss"
      const cleanDate = dateStr.replace(" às ", " ").replace(",", "").trim()

      // Parse formato brasileiro: "DD/MM/YYYY HH:mm:ss" ou "DD/MM/YYYY HH:mm"
      const parts = cleanDate.match(/(\d{2})\/(\d{2})\/(\d{4})[,\s]+(\d{2}):(\d{2})(?::(\d{2}))?/)

      if (parts) {
        const [, day, month, year, hour, minute, second] = parts
        // Mês é 0-indexed no JavaScript
        const date = new Date(
          Number.parseInt(year),
          Number.parseInt(month) - 1,
          Number.parseInt(day),
          Number.parseInt(hour),
          Number.parseInt(minute),
          second ? Number.parseInt(second) : 0,
        )
        return date.getTime()
      }

      // Fallback: tenta o parsing padrão
      const fallbackDate = new Date(dateStr)
      return fallbackDate.getTime()
    } catch (error) {
      console.error("Error parsing date:", error)
      return Date.now()
    }
  }

  const calculateDueDate = (createdAt: number): string => {
    if (!createdAt || isNaN(createdAt)) {
      return "Data inválida"
    }

    const dueDate = new Date(createdAt + 30 * 24 * 60 * 60 * 1000)
    const formattedDate = dueDate.toLocaleDateString("pt-BR")

    return formattedDate
  }

  const calculateFee = (transaction: Transaction): number => {
    const createdAt = getTransactionTimestamp(transaction.date)
    const daysSinceCreation = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24))

    let feePercentage = 0.1 // 10% fee

    if (daysSinceCreation > 30) {
      feePercentage = 0.12 // 10% + 2% extra fee
    }

    return feePercentage
  }

  const handleGenerateQrFromHistory = async (transaction: Transaction) => {
    // Apenas gera QR code para transferências
    if (transaction.type !== "transfer") return

    setIsGenerating(true)
    setShowQrModal(false)
    setPollingStatus("idle")
    setSelectedTransactionForQr(transaction)

    const newTransactionId = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setAwaitingTransactionId(newTransactionId)

    const amount = transaction.amount
    const bonusAmount = amount * 0.1 // 10% rendimento para exibição
    const totalCredit = amount + bonusAmount

    if (onCreatePendingTransaction) {
      onCreatePendingTransaction(totalCredit, newTransactionId)
    } else if (onUpdateTransactionStatus) {
      onUpdateTransactionStatus(transaction.id, "Aguardando Pagamento")
    }

    try {
      const config = getMisticPayConfig()

      if (!config) {
        alert("Configuração da API não encontrada. Configure no painel administrativo.")
        setAwaitingTransactionId(null)
        setIsGenerating(false)
        if (onUpdateTransactionStatus) {
          onUpdateTransactionStatus(newTransactionId, "Erro")
        }
        return
      }

      const createdAt = getTransactionTimestamp(transaction.date)
      const isOverdue = isTransactionOverdue(createdAt)
      const feePercentage = isOverdue ? 0.12 : 0.1 // 12% if overdue, 10% otherwise
      const qrFee = amount * feePercentage
      const amountWithFee = amount + qrFee

      const response = await fetch("/api/pix-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountWithFee,
          payerName: "Cliente",
          payerDocument: "000.000.000-00",
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          endpoint: config.endpoint,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao gerar QR code")
      }

      const data = await response.json()

      const apiChargeId = data.chargeId

      if (apiChargeId && onUpdateTransactionStatus) {
        onUpdateTransactionStatus(newTransactionId, "Aguardando Pagamento")
      }

      setQrCodeData({
        qrcode: data.qrCode || data.qrcodeUrl,
        copyPaste: data.pixCopyPaste || data.copyPaste,
        amount: amountWithFee,
        fee: qrFee,
        originalAmount: amount,
        chargeId: apiChargeId,
      })
      setShowQrModal(true)

      if (apiChargeId) {
        startPaymentPolling(apiChargeId, totalCredit, newTransactionId)
      }
    } catch (error) {
      alert(`Erro ao gerar QR code: ${error instanceof Error ? error.message : "Tente novamente."}`)
      if (onUpdateTransactionStatus) {
        onUpdateTransactionStatus(newTransactionId, "Erro ao gerar QR Code")
      }
      setAwaitingTransactionId(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const startPaymentPolling = (apiChargeId: string, creditAmount: number, localTransactionId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    setPollingStatus("checking")

    let pollCount = 0
    const maxPolls = 60

    pollingIntervalRef.current = setInterval(async () => {
      pollCount++

      if (pollCount > maxPolls) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        setPollingStatus("timeout")
        if (onUpdateTransactionStatus) {
          onUpdateTransactionStatus(localTransactionId, "Tempo Esgotado")
        }
        return
      }

      try {
        const config = getMisticPayConfig()
        if (!config) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          setPollingStatus("idle")
          setAwaitingTransactionId(null)
          return
        }

        const response = await fetch("/api/check-payment-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: apiChargeId,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            endpoint: config.endpoint,
          }),
        })

        if (response.ok) {
          const result = await response.json()

          if (result.paid && onUpdateTransactionStatus) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }

            setPollingStatus("completed")
            setAwaitingTransactionId(null)
            onUpdateTransactionStatus(localTransactionId, "COMPLETO", creditAmount)
            setShowQrModal(false)
          }
        }
      } catch (error) {
        console.error("Erro no polling:", error)
      }
    }, 5000)
  }

  const handleCopyCode = () => {
    if (qrCodeData?.copyPaste) {
      navigator.clipboard.writeText(qrCodeData.copyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClearHistory = () => {
    if (confirm("Tem certeza que deseja excluir todo o histórico de transações? Esta ação não pode ser desfeita.")) {
      onClearHistory?.()
    }
  }

  const handleModalClose = (open: boolean) => {
    if (!open) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      setAwaitingTransactionId(null)
      setPollingStatus("idle")
    }
    setShowQrModal(open)
  }

  const getStatusConfig = (status: string, isOverdue: boolean) => {
    const statusLower = status.toLowerCase()
    if (
      statusLower === "concluída" ||
      statusLower === "recebido" ||
      statusLower === "pago" ||
      statusLower === "confirmado" ||
      statusLower === "completo"
    ) {
      return {
        variant: "default" as const,
        icon: CheckCircle2,
        className: "bg-green-500 hover:bg-green-600 text-white",
        displayText: "PAGO",
      }
    }
    if (statusLower === "aguardando pagamento") {
      return {
        variant: "secondary" as const,
        icon: Clock,
        className: "bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse",
        displayText: "Aguardando Pagamento",
      }
    }
    if (isOverdue && statusLower !== "completo" && statusLower !== "pago") {
      return {
        variant: "secondary" as const,
        icon: AlertCircle,
        className: "bg-red-500 hover:bg-red-600 text-white",
        displayText: "Vencimento",
      }
    }
    if (statusLower === "pendente") {
      return {
        variant: "secondary" as const,
        icon: Clock,
        className: "bg-yellow-500 hover:bg-yellow-600 text-white",
        displayText: "Pendente",
      }
    }
    if (statusLower === "tempo esgotado") {
      return {
        variant: "secondary" as const,
        icon: Clock,
        className: "bg-orange-500 hover:bg-orange-600 text-white",
        displayText: "Tempo Esgotado",
      }
    }
    if (
      statusLower === "cancelado" ||
      statusLower === "falhou" ||
      statusLower === "erro" ||
      statusLower.includes("erro")
    ) {
      return {
        variant: "destructive" as const,
        icon: XCircle,
        className: "bg-red-500 hover:bg-red-600 text-white",
      }
    }
    return {
      variant: "outline" as const,
      icon: CheckCircle2,
      className: "",
      displayText: status,
    }
  }

  return (
    <>
      <Card className="p-4 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
          <h2 className="text-xl sm:text-3xl font-bold text-center sm:text-left flex-1">Histórico de Transações</h2>
          {isAdmin && onClearHistory && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearHistory}
              className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Histórico
            </Button>
          )}
        </div>
        <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
          {transactions.map((transaction) => {
            const createdAt = getTransactionTimestamp(transaction.date)
            const isOverdue = isTransactionOverdue(createdAt)
            const dueDate = calculateDueDate(createdAt)

            const statusConfig = getStatusConfig(transaction.status, isOverdue)
            const StatusIcon = statusConfig.icon

            const displayAmount =
              transaction.type === "transfer" && transaction.fee
                ? `- R$ ${transaction.amount.toFixed(2).replace(".", ",")} (+ R$ ${transaction.fee.toFixed(2).replace(".", ",")} taxa)`
                : transaction.type === "deposit"
                  ? transaction.status === "Aguardando Pagamento"
                    ? ""
                    : `+ R$ ${transaction.amount.toFixed(2).replace(".", ",")}`
                  : `- R$ ${transaction.amount.toFixed(2).replace(".", ",")}`

            const amountColor =
              transaction.type === "deposit" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"

            return (
              <div
                key={transaction.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border"
              >
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-lg truncate">{transaction.pixType}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{transaction.pixKey}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    {transaction.type === "transfer" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Vencimento: {dueDate} {isOverdue ? "(Vencido)" : "(Em dia)"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  {displayAmount && (
                    <div className="text-right">
                      <p
                        className={`font-bold text-sm sm:text-xl ${amountColor} ${transaction.type === "transfer" ? "cursor-pointer hover:opacity-70 transition-opacity" : ""}`}
                        onClick={() => {
                          if (transaction.type === "transfer") {
                            handleGenerateQrFromHistory(transaction)
                          }
                        }}
                        title={transaction.type === "transfer" ? "Clique para gerar QR code com taxa" : ""}
                      >
                        {displayAmount}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-1 mt-1 justify-end flex-wrap">
                    <Badge variant={statusConfig.variant} className={`text-xs ${statusConfig.className}`}>
                      <StatusIcon className={`w-3 h-3 mr-1 ${statusConfig.icon === Loader2 ? "animate-spin" : ""}`} />
                      {statusConfig.displayText || transaction.status}
                    </Badge>
                    {transaction.type === "transfer" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerateQrFromHistory(transaction)
                        }}
                      >
                        Pagar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onShowReceipt?.(transaction)}
                      className="h-6 px-2 text-xs"
                      title="Ver recibo"
                    >
                      <FileText className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Dialog open={showQrModal} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>QR Code Pix</span>
              <Badge
                variant="secondary"
                className={
                  pollingStatus === "completed"
                    ? "bg-green-500 text-white"
                    : pollingStatus === "timeout"
                      ? "bg-orange-500 text-white"
                      : "bg-blue-500 text-white"
                }
              >
                {pollingStatus === "checking" && (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Verificando Automaticamente
                  </>
                )}
                {pollingStatus === "timeout" && (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Tempo Esgotado
                  </>
                )}
                {pollingStatus === "completed" && (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Confirmado
                  </>
                )}
                {pollingStatus === "idle" && (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Aguardando
                  </>
                )}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {pollingStatus === "checking"
                ? "O sistema está verificando automaticamente se o pagamento foi recebido via API"
                : pollingStatus === "timeout"
                  ? "O tempo de verificação automática expirou. Entre em contato com o suporte se já realizou o pagamento"
                  : pollingStatus === "completed"
                    ? "Pagamento confirmado com sucesso!"
                    : "Escaneie o QR code ou copie o código Pix para receber o pagamento"}
            </DialogDescription>
          </DialogHeader>
          {qrCodeData && (
            <div className="space-y-4">
              <div className="text-center space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor original:</span>
                  <span className="font-medium">R$ {qrCodeData.originalAmount.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa:</span>
                  <span className="font-medium text-orange-600">
                    + R$ {qrCodeData.fee.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Total a pagar:</span>
                    <span className="text-2xl font-bold text-green-600">
                      R$ {qrCodeData.amount.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-border bg-green-50 dark:bg-green-950 rounded p-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700 dark:text-green-300 font-semibold">Taxa:</span>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      R$ {(qrCodeData.originalAmount * 0.1).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  {pollingStatus === "checking" && "Aguardando confirmação automática da API..."}
                  {pollingStatus === "timeout" && "Tempo de verificação expirou"}
                  {pollingStatus === "completed" && "Pagamento confirmado!"}
                  {pollingStatus === "idle" && "Escaneie o QR code para pagar"}
                </p>
              </div>

              <div className="flex justify-center p-4 bg-white rounded-lg">
                <Image
                  src={qrCodeData.qrcode || "/placeholder.svg"}
                  alt="QR Code Pix"
                  width={256}
                  height={256}
                  className="w-64 h-64"
                  unoptimized
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Pix Copia e Cola</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrCodeData.copyPaste}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-muted rounded-md"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyCode}>
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {pollingStatus === "checking" && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                  <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <AlertTitle className="text-blue-700 dark:text-blue-300">Verificando Pagamento</AlertTitle>
                  <AlertDescription className="text-blue-600 dark:text-blue-400">
                    O sistema está verificando automaticamente o pagamento
                  </AlertDescription>
                </Alert>
              )}

              {pollingStatus === "timeout" && (
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertTitle className="text-orange-700 dark:text-orange-300">Tempo Esgotado</AlertTitle>
                  <AlertDescription className="text-orange-600 dark:text-orange-400">
                    Se você já pagou, o sistema pode estar processando a confirmação. Entre em contato com o suporte se
                    necessário.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
