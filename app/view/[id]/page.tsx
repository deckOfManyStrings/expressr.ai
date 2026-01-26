"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Download, Lock, Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Expression {
    name: string
    emoji: string
    url: string
    isPaid: boolean
}

export default function ViewPage({ params }: { params: { id: string } }) {
    const [job, setJob] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchJob = async () => {
            const { data, error } = await supabase
                .from("jobs")
                .select("*")
                .eq("id", params.id)
                .single()

            if (error) {
                toast.error("Job not found")
            } else {
                setJob(data)
            }
            setLoading(false)
        }

        fetchJob()
    }, [params.id, supabase])

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
    if (!job) return <div className="min-h-screen flex items-center justify-center">Job not found</div>

    const expressions = job.expressions_urls || []
    const isPaid = job.paid

    // Placeholder for locked expressions
    const LOCKED_EXPRESSIONS = [
        { name: "Shocked", emoji: "😱" },
        { name: "Excited", emoji: "🤩" },
        { name: "Thinking", emoji: "🤔" },
        { name: "Laughing", emoji: "😂" },
        { name: "Surprised", emoji: "😲" },
        { name: "Confused", emoji: "🤨" },
        { name: "Serious", emoji: "😐" },
        { name: "Smirking", emoji: "😏" },
        { name: "Disgusted", emoji: "🤢" },
    ]

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <span className="font-bold text-lg">Expressr.ai</span>
                {!isPaid && <Button size="sm">Get Full Pack $9.99</Button>}
                {isPaid && <Button variant="outline" size="sm">Download PDF</Button>}
            </header>

            <main className="max-w-4xl mx-auto p-6 space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Your Expressions</h1>
                    <p className="text-muted-foreground">
                        {isPaid ? "Here is your complete pack." : "Here are 3 free expressions. Unlock the rest below."}
                    </p>
                </div>

                {/* Free Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {expressions.map((expr: Expression, i: number) => (
                        <Card key={i} className="overflow-hidden group">
                            <div className="aspect-square relative bg-muted">
                                <img src={expr.url} alt={expr.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => window.open(expr.url)}
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <span className="font-medium">{expr.emoji} {expr.name}</span>
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Free</span>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Upsell Section */}
                {!isPaid && (
                    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20 rounded-3xl p-8 space-y-8">
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-bold">Want All 12 Expressions? 🎨</h2>
                            <p className="max-w-lg mx-auto text-muted-foreground">
                                Unlock 9 more professional expressions for your thumbnails. One-time payment.
                            </p>
                        </div>

                        {/* Locked Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 opacity-75">
                            {LOCKED_EXPRESSIONS.map((expr, i) => (
                                <div key={i} className="aspect-square bg-muted rounded-xl flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                                    <div className="absolute inset-0 backdrop-blur-[2px] bg-background/50 z-0" />
                                    <span className="text-2xl relative z-10">{expr.emoji}</span>
                                    <span className="text-xs font-medium relative z-10">{expr.name}</span>
                                    <Lock className="w-4 h-4 text-muted-foreground absolute top-2 right-2 z-10" />
                                </div>
                            ))}
                            <div className="hidden md:flex aspect-square bg-primary/10 rounded-xl items-center justify-center text-primary font-bold">
                                + PDF
                            </div>
                        </div>

                        {/* CTA */}
                        <Card className="max-w-md mx-auto p-6 border-primary/30 shadow-lg bg-background">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <div className="text-sm text-muted-foreground line-through">$49.99</div>
                                    <div className="text-4xl font-bold text-primary">$9.99</div>
                                    <div className="text-xs text-muted-foreground">One-time payment</div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="text-xs flex items-center justify-end gap-1"><Check className="w-3 h-3 text-green-500" /> High Res</div>
                                    <div className="text-xs flex items-center justify-end gap-1"><Check className="w-3 h-3 text-green-500" /> PDF Pack</div>
                                </div>
                            </div>
                            <Button className="w-full h-12 text-lg shadow-xl shadow-primary/20">
                                Unlock Full Pack <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    )
}
