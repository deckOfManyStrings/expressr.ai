"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ArrowLeft, Mail, Loader2 } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch("/api/recover", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()

            if (data.success) {
                setSent(true)
                toast.success("Recovery email sent!")
            } else {
                toast.info("No orders found for this email.")
            }
        } catch (error) {
            console.error("Login error:", error)
            toast.error("Failed to send recovery email")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]">
            <div className="absolute top-6 left-6">
                <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
            </div>

            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Access Your Photos</h1>
                    <p className="text-muted-foreground">Enter the email you used to create your expression pack.</p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                            Send Magic Link
                        </Button>
                    </form>
                ) : (
                    <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-lg text-center space-y-2 border border-green-200 dark:border-green-800">
                        <h3 className="font-semibold text-green-800 dark:text-green-300">Check your inbox!</h3>
                        <p className="text-sm text-green-700 dark:text-green-400">
                            We've sent a link to <strong>{email}</strong> with access to all your previous orders.
                        </p>
                        <Button variant="outline" className="w-full mt-4" onClick={() => setSent(false)}>
                            Try another email
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
