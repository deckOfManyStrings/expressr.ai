"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowRight, Check, Upload, Sparkles, Download, Camera } from "lucide-react"

export default function Home() {
  const [email, setEmail] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      router.push(`/create?email=${encodeURIComponent(email)}`)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-24 text-center overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 -z-10" />
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-primary uppercase bg-primary/10 rounded-full">
            AI Expression Generator
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Your Face. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              12 Expressions.
            </span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-muted-foreground sm:text-xl">
            Stop using generic AI faces. Get professional expressions of
            <span className="font-semibold text-foreground"> YOUR actual face </span>
            in minutes.
          </p>

          {/* Email Input CTA */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm mx-auto mt-8 sm:flex-row">
            <Input
              type="email"
              placeholder="Enter your email"
              className="h-12 text-base"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button size="lg" className="h-12 w-full sm:w-auto font-semibold">
              Get 3 Free <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            No credit card required • 3 free expressions
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How Expressr Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Camera,
                title: "1. Upload Selfies",
                desc: "Upload 10-15 photos of your face. Different angles & lighting works best."
              },
              {
                icon: Sparkles,
                title: "2. AI Learns You",
                desc: "We train a custom AI model on your unique facial features in ~10 minutes."
              },
              {
                icon: Download,
                title: "3. Get Expressions",
                desc: "Download 12 professional expressions (Happy, Sad, Shocked, etc.) ready for thumbnails."
              }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-4 p-6 bg-background rounded-2xl shadow-sm border">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto grid gap-12 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Why Creators Love Expressr</h2>
            <div className="space-y-4">
              {[
                "Your Actual Face (Not Generic AI)",
                "Professional Studio Quality",
                "12 Emotions Ready to Use",
                "Compatible with Canva & Photoshop",
                "One-time Payment (No Subscription)"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-square bg-muted rounded-3xl overflow-hidden border">
            {/* Placeholder for feature image/grid */}
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              [Expression Grid Image]
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Simple Pricing</h2>
          <div className="grid gap-8 md:grid-cols-2 max-w-2xl mx-auto">
            {/* Free Tier */}
            <div className="bg-background p-8 rounded-3xl border shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Free Preview</h3>
              <div className="text-4xl font-bold mb-4">$0</div>
              <ul className="space-y-3 text-left mb-8">
                <li className="flex gap-2"><Check className="w-5 h-5 text-green-500" /> 3 Expressions</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-green-500" /> Web View</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-green-500" /> Individual Downloads</li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => document.querySelector('input')?.focus()}>Try Free</Button>
            </div>

            {/* Paid Tier */}
            <div className="bg-background p-8 rounded-3xl border-2 border-primary shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
              <h3 className="text-xl font-semibold mb-2">Full Pack</h3>
              <div className="text-4xl font-bold mb-4">$9.99</div>
              <ul className="space-y-3 text-left mb-8">
                <li className="flex gap-2"><Check className="w-5 h-5 text-primary" /> All 12 Expressions</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-primary" /> High Resolution</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-primary" /> PDF Download</li>
              </ul>
              <Button className="w-full">Get Full Pack</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: "Is the free version really free?",
                a: "Yes! You get 3 expressions (Happy, Sad, Angry) completely free. No credit card required."
              },
              {
                q: "How long does it take?",
                a: "About 10 minutes for the AI to learn your face, then expression generation is instant."
              },
              {
                q: "What photos should I upload?",
                a: "Upload 10-15 selfies with different angles, good lighting, and a clear view of your face."
              },
              {
                q: "Can I use these commercially?",
                a: "Yes! You own the images. Use them in YouTube thumbnails, social media, wherever."
              }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <p>© 2024 Expressr.ai. All rights reserved.</p>
      </footer>
    </div>
  )
}
