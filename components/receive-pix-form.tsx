"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { QrCode, Copy, Check, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { createPixCharge, checkPaymentStatus } from "@/lib/misticpay-api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ReceivePixFormProps {
  balance: number
  onReceive: (amount: number, chargeId?: string, initialStatus?: string) => void
  onUpdateTransactionStatus?: (chargeId: string, newStatus: string, amount?: number) => void
  initialAmount?: number | null
  onAmountUsed?: () => void
}

export function ReceivePixForm({
  balance,
  onReceive,
  onUpdateTransactionStatus,
  initialAmount,
  onAmountUsed,
}: ReceivePixFormProps) {
  const [amount, setAmount] = useState("")
  const [displayAmount, setDisplayAmount] = useState("")
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [pixCopyPaste, setPixCopyPaste] = useState<string | null>(null)
  const [chargeId, setChargeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string>("PENDING")
  const { toast } = useToast()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollCountRef = useRef(0)

  useEffect(() => {
    if (initialAmount && initialAmount > 0) {
      const formatted = initialAmount.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      setDisplayAmount(formatted)
      setAmount(initialAmount.toString())
      onAmountUsed?.()
    }
  }, [initialAmount, onAmountUsed])

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

  useEffect(() => {
    if (chargeId && qrCodeData) {
      startPaymentPolling()
    }

    return () => {
      stopPaymentPolling()
    }
  }, [chargeId, qrCodeData])

  const startPaymentPolling = () => {
    stopPaymentPolling()
    pollCountRef.current = 0
    setCheckingPayment(true)
    setPaymentStatus("PENDING")

    pollingIntervalRef.current = setInterval(async () => {
      await checkPayment()
    }, 5000)
  }

  const stopPaymentPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setCheckingPayment(false)
  }

  const checkPayment = async () => {
    if (!chargeId) {
      return
    }

    pollCountRef.current += 1

    if (pollCountRef.current > 60) {
      stopPaymentPolling()
      toast({
        title: "Tempo esgotado",
        description: "Não foi possível confirmar o pagamento automaticamente. Use a confirmação manual.",
        variant: "destructive",
      })
      return
    }

    const result = await checkPaymentStatus(chargeId)

    if (result.success && result.paid) {
      stopPaymentPolling()
      setPaymentStatus("COMPLETO")

      const numAmount = Number.parseFloat(amount)
      const originalAmount = numAmount / 1.1 // Remove os 10%
      const creditAmount = originalAmount * 1.3 // Credita 130%

      if (onUpdateTransactionStatus) {
        onUpdateTransactionStatus(chargeId, "COMPLETO", creditAmount) // Passando 130%
      }

      toast({
        title: "Pagamento Recebido!",
        description: `R$ ${creditAmount.toFixed(2).replace(".", ",")} (valor principal + 30% de bônus) foi creditado automaticamente em sua conta.`,
        duration: 5000,
      })

      setTimeout(() => {
        setQrCodeData(null)
        setPixCopyPaste(null)
        setChargeId(null)
        setAmount("")
        setDisplayAmount("")
        setShowConfirmation(false)
        setPaymentStatus("PENDING")
      }, 3000)
    } else if (result.status) {
      setPaymentStatus(result.status)

      if (onUpdateTransactionStatus && result.status !== "PENDING") {
        onUpdateTransactionStatus(chargeId, result.status)
      }
    }
  }

  const handleGenerateQrCode = async () => {
    if (!amount) {
      toast({
        title: "Erro",
        description: "Insira um valor para gerar o QR code",
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

    setLoading(true)

    const result = await createPixCharge(numAmount)

    setLoading(false)

    if (result.success && result.qrCode && result.pixCopyPaste) {
      setQrCodeData(result.qrCode)
      setPixCopyPaste(result.pixCopyPaste)

      const savedChargeId = result.chargeId || null
      setChargeId(savedChargeId)

      setShowConfirmation(false)

      if (savedChargeId) {
        onReceive(numAmount, savedChargeId, "Aguardando Confirmação da API")
      }

      toast({
        title: "QR Code gerado!",
        description: `QR Code para receber R$ ${numAmount.toFixed(2).replace(".", ",")} foi criado com sucesso.`,
      })
    } else {
      toast({
        title: "Erro ao gerar QR Code",
        description: result.message || "Não foi possível gerar o QR Code. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleConfirmPayment = () => {
    if (!amount || !chargeId) return

    const numAmount = Number.parseFloat(amount)
    const originalAmount = numAmount / 1.1 // Remove os 10%
    const creditAmount = originalAmount * 1.3 // Credita 130%

    stopPaymentPolling()

    if (onUpdateTransactionStatus) {
      onUpdateTransactionStatus(chargeId, "COMPLETO", creditAmount) // Passando 130%
    } else {
      onReceive(creditAmount, chargeId, "COMPLETO") // Passando 130%
    }

    toast({
      title: "Pagamento Confirmado!",
      description: `R$ ${creditAmount.toFixed(2).replace(".", ",")} (valor principal + 30% de bônus) foi creditado em sua conta.`,
      duration: 5000,
    })

    setQrCodeData(null)
    setPixCopyPaste(null)
    setChargeId(null)
    setAmount("")
    setDisplayAmount("")
    setShowConfirmation(false)
    setPaymentStatus("PENDING")
  }

  const handleCopyPixCode = () => {
    if (pixCopyPaste) {
      navigator.clipboard.writeText(pixCopyPaste)
      setCopied(true)
      toast({
        title: "Copiado!",
        description: "Código Pix copiado para a área de transferência",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="p-6 mb-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Receber Pix</h2>

      <div className="space-y-6">
        <div>
          <Label htmlFor="receiveAmount" className="text-base font-semibold">
            Valor a Receber (R$)
          </Label>
          <Input
            id="receiveAmount"
            type="text"
            value={displayAmount}
            onChange={(e) => formatCurrency(e.target.value)}
            placeholder="0,00"
            className="h-12 text-base mt-2"
            disabled={!!qrCodeData}
          />
        </div>

        {!qrCodeData && (
          <Button onClick={handleGenerateQrCode} className="w-full h-12 text-base font-semibold" disabled={loading}>
            {loading ? (
              "Gerando..."
            ) : (
              <>
                <QrCode className="w-5 h-5 mr-2" />
                Gerar QR Code
              </>
            )}
          </Button>
        )}

        {qrCodeData && pixCopyPaste && (
          <div className="mt-6 space-y-4">
            <Alert
              className={
                paymentStatus === "COMPLETO" || paymentStatus === "PAID"
                  ? "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
                  : "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800"
              }
            >
              {paymentStatus === "COMPLETO" || paymentStatus === "PAID" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-900 dark:text-green-100">Pagamento Confirmado!</AlertTitle>
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    O pagamento foi recebido e creditado em sua conta.
                  </AlertDescription>
                </>
              ) : (
                <>
                  {checkingPayment ? (
                    <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                  <AlertTitle className="text-blue-900 dark:text-blue-100">
                    {checkingPayment ? "Verificando pagamento automaticamente..." : "Aguardando pagamento"}
                  </AlertTitle>
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    {checkingPayment ? (
                      <p>
                        O sistema está verificando automaticamente se o pagamento foi recebido. Você será notificado
                        quando o pagamento for confirmado.
                      </p>
                    ) : (
                      <ol className="list-decimal list-inside space-y-1 mt-2">
                        <li>Escaneie o QR Code ou copie o código Pix</li>
                        <li>Aguarde o pagador realizar o pagamento</li>
                        <li>O sistema confirmará automaticamente ou use a confirmação manual</li>
                      </ol>
                    )}
                  </AlertDescription>
                </>
              )}
            </Alert>

            <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                Valor: R$ {Number.parseFloat(amount).toFixed(2).replace(".", ",")}
              </p>
              <img
                src={qrCodeData || "/placeholder.svg"}
                alt="QR Code Pix"
                className="w-64 h-64 border-4 border-white dark:border-gray-700 rounded-lg shadow-md"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Escaneie com o app do seu banco</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Código Pix Copia e Cola</Label>
              <div className="flex gap-2">
                <Input value={pixCopyPaste} readOnly className="font-mono text-xs bg-gray-50 dark:bg-gray-900" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPixCode}
                  className="flex-shrink-0 bg-transparent"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use este código em "Pix Copia e Cola" no seu aplicativo bancário
              </p>
            </div>

            {paymentStatus !== "COMPLETO" && paymentStatus !== "PAID" && !showConfirmation && (
              <Button
                onClick={() => setShowConfirmation(true)}
                className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirmar Recebimento Manualmente
              </Button>
            )}

            {showConfirmation && (
              <div className="space-y-3">
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-amber-900 dark:text-amber-100">Confirmar recebimento?</AlertTitle>
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    O valor de R$ {((Number.parseFloat(amount) / 1.1) * 1.3).toFixed(2).replace(".", ",")} (valor
                    principal + 30% de bônus) será creditado no seu saldo.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button
                    onClick={handleConfirmPayment}
                    className="flex-1 h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Confirmar
                  </Button>
                  <Button
                    onClick={() => setShowConfirmation(false)}
                    variant="outline"
                    className="flex-1 h-12 text-base font-semibold"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                stopPaymentPolling()
                setQrCodeData(null)
                setPixCopyPaste(null)
                setChargeId(null)
                setShowConfirmation(false)
                setPaymentStatus("PENDING")
              }}
              variant="ghost"
              className="w-full"
            >
              Gerar Novo QR Code
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
