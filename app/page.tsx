"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PixTransferForm } from "@/components/pix-transfer-form"
import { TransactionHistory } from "@/components/transaction-history"
import { ReceiptModal } from "@/components/receipt-modal"
import { Moon, Sun, LogOut, User } from "lucide-react"
import { getCurrentUser, logoutUser, isUserAdmin, updateUserBalance } from "@/lib/auth"
import type { User as UserType } from "@/lib/auth"

export interface Transaction {
  id: string
  date: string
  pixKey: string
  pixType: string
  amount: number
  status: string
  chargeId?: string
  fee?: number
  type?: "transfer" | "deposit"
}

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg mx-auto">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">Bem-vindo!</h1>
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
            Gerenciador de transferências Pix com segurança e praticidade
          </p>
        </div>
        <Button
          onClick={onContinue}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-lg transition-colors"
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}

export default function PixFacilPage() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/login")
      return
    }
    if (isUserAdmin(user)) {
      router.push("/admin")
      return
    }
    setCurrentUser(user)
    setBalance(user.balance)
  }, [router])

  useEffect(() => {
    if (currentUser) {
      updateUserBalance(currentUser.id, balance)
    }
  }, [balance, currentUser])

  useEffect(() => {
    const savedTransactions = localStorage.getItem("e18pix_transactions")
    if (savedTransactions) {
      try {
        const parsedTransactions = JSON.parse(savedTransactions)
        setTransactions(parsedTransactions)
      } catch (error) {
        console.error("Erro ao carregar transações:", error)
        localStorage.removeItem("e18pix_transactions")
        setTransactions([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("e18pix_transactions", JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  const handleTransfer = (pixKey: string, pixType: string, amount: number, success: boolean, fee?: number) => {
    console.log("[v0] handleTransfer chamado com sucesso:", success)

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleString("pt-BR"),
      pixKey,
      pixType,
      amount,
      status: success ? "concluída" : "falhou",
      fee: fee || 0,
      type: "transfer",
    }

    setTransactions((prev) => [newTransaction, ...prev])

    if (success) {
      console.log("[v0] Descontando", amount, "do saldo")
      setBalance((prev) => prev - amount)
    } else {
      console.log("[v0] Transferência falhou, saldo mantido")
    }
  }

  const handleReceivePix = (amount: number, chargeId?: string, initialStatus = "recebido") => {
    const originalAmount = amount / 1.1 // Remove os 10% já adicionados
    const creditAmount = originalAmount * 1.3 // Credita 130% (valor principal + 30%)

    const newTransaction: Transaction = {
      id: chargeId || Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleString("pt-BR"),
      pixKey: "QR Code",
      pixType: "Recebimento",
      amount: creditAmount, // Usando 130% do valor
      status: initialStatus,
      chargeId: chargeId,
      type: "deposit",
    }

    setTransactions((prev) => [newTransaction, ...prev])

    if (initialStatus === "recebido" || initialStatus === "COMPLETO") {
      setBalance((prevBalance) => {
        const newBalance = prevBalance + creditAmount // Adicionando 130%
        return newBalance
      })
    }
  }

  const handleUpdateTransactionStatus = (chargeId: string, newStatus: string, amount?: number) => {
    setTransactions((prev) => {
      const transactionIndex = prev.findIndex((t) => t.chargeId === chargeId || t.id === chargeId)

      if (transactionIndex === -1) {
        return prev
      }

      const transaction = prev[transactionIndex]

      const wasNotCompleted =
        transaction.status !== "COMPLETO" && transaction.status !== "recebido" && transaction.status !== "PAGO"

      if ((newStatus === "COMPLETO" || newStatus === "PAGO") && amount && wasNotCompleted) {
        const originalAmount = amount / 1.1 // Remove os 10%
        const creditAmount = originalAmount * 1.3 // Credita 130%

        setBalance((prevBalance) => {
          const newBalance = prevBalance + creditAmount // Adicionando 130%
          return newBalance
        })
      }

      const updated = [...prev]
      updated[transactionIndex] = {
        ...transaction,
        status: newStatus === "COMPLETO" ? "PAGO" : newStatus,
        chargeId: chargeId,
      }

      return updated
    })
  }

  const handleClearHistory = () => {
    setTransactions([])
    localStorage.removeItem("e18pix_transactions")
  }

  const handleCreatePendingTransaction = (amount: number, transactionId: string) => {
    const originalAmount = amount / 1.1 // Remove os 10% para obter valor original
    const actualCredit = originalAmount * 1.3 // Credita 130% do valor original

    const newTransaction: Transaction = {
      id: transactionId,
      date: new Date().toLocaleString("pt-BR"),
      pixKey: "QR Code",
      pixType: "Recebimento",
      amount: actualCredit, // Usando o valor de crédito real (130%)
      status: "Aguardando Pagamento",
      chargeId: transactionId,
      type: "deposit",
    }

    setTransactions((prev) => [newTransaction, ...prev])
  }

  const handleLogout = () => {
    logoutUser()
    router.push("/login")
  }

  if (!currentUser) {
    return null
  }

  if (showWelcome) {
    return <WelcomeScreen onContinue={() => setShowWelcome(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6 sm:mb-8 pt-2 sm:pt-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent truncate">
                E18PIX+
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 truncate">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{currentUser.name}</span>
                <span className="hidden sm:inline ml-1 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                  Cliente
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
              title="Sair"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </header>

        <Card className="p-4 sm:p-6 mb-4 sm:mb-6 bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs sm:text-sm opacity-90 mb-1">Saldo disponível</div>
              <div className="text-2xl sm:text-4xl font-bold">R$ {balance.toFixed(2).replace(".", ",")}</div>
            </div>
          </div>
        </Card>

        <PixTransferForm balance={balance} onTransfer={handleTransfer} onShowReceipt={setSelectedReceipt} />

        {transactions.length > 0 && (
          <TransactionHistory
            transactions={transactions}
            onClearHistory={handleClearHistory}
            isAdmin={false}
            onUpdateTransactionStatus={handleUpdateTransactionStatus}
            onCreatePendingTransaction={handleCreatePendingTransaction}
            onShowReceipt={setSelectedReceipt}
          />
        )}

        {selectedReceipt && <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}
      </div>
    </div>
  )
}
