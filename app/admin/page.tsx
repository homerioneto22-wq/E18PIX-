"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PixTransferForm } from "@/components/pix-transfer-form"
import { AdminPanel } from "@/components/admin-panel"
import { TransactionHistory } from "@/components/transaction-history"
import { UserManagement } from "@/components/user-management"
import { Moon, Sun, LogOut, User, Shield } from "lucide-react"
import { getCurrentUser, logoutUser, isUserAdmin } from "@/lib/auth"
import type { User as UserType } from "@/lib/auth"

export interface Transaction {
  id: string
  date: string
  pixKey: string
  pixType: string
  amount: number
  status: string
  chargeId?: string
}

export default function AdminPage() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [balance, setBalance] = useState(0)
  const [showAdmin, setShowAdmin] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/login")
      return
    }
    if (!isUserAdmin(user)) {
      router.push("/")
      return
    }
    setCurrentUser(user)
  }, [router])

  useEffect(() => {
    const savedBalance = localStorage.getItem("e18pix_balance")
    if (savedBalance) {
      const parsedBalance = Number.parseFloat(savedBalance)
      setBalance(parsedBalance)
    } else {
      setBalance(0)
      localStorage.setItem("e18pix_balance", "0")
    }

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
    localStorage.setItem("e18pix_balance", balance.toString())
  }, [balance])

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

  const handleTransfer = (pixKey: string, pixType: string, amount: number) => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleString("pt-BR"),
      pixKey,
      pixType,
      amount,
      status: "concluída",
    }

    setTransactions((prev) => [newTransaction, ...prev])
    setBalance((prev) => prev - amount)
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
    const newTransaction: Transaction = {
      id: transactionId,
      date: new Date().toLocaleString("pt-BR"),
      pixKey: "QR Code",
      pixType: "Recebimento",
      amount: amount,
      status: "Aguardando Pagamento",
      chargeId: transactionId,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                E18PIX+ Admin
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                {currentUser.name}
                <span className="ml-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                  Administrador
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="rounded-full">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full" title="Sair">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <Card className="p-6 mb-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl">
          <div className="flex items-center justify-center">
            <div>
              <div className="text-sm opacity-90 mb-1">Saldo do sistema</div>
              <div className="text-4xl font-bold">R$ {balance.toFixed(2).replace(".", ",")}</div>
            </div>
          </div>
        </Card>

        <AdminPanel balance={balance} setBalance={setBalance} onClose={() => {}} onAuthenticate={() => {}} />

        <UserManagement />

        <PixTransferForm balance={balance} onTransfer={handleTransfer} />

        {transactions.length > 0 && (
          <TransactionHistory
            transactions={transactions}
            onClearHistory={handleClearHistory}
            isAdmin={true}
            onUpdateTransactionStatus={handleUpdateTransactionStatus}
            onCreatePendingTransaction={handleCreatePendingTransaction}
          />
        )}
      </div>
    </div>
  )
}
