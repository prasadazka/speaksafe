import Link from "next/link";
import { Shield, FileText, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">SpeakSafe</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/track">
              <Button variant="ghost" size="sm">Track Report</Button>
            </Link>
            <Link href="/report">
              <Button size="sm">Submit Report</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Lock className="h-3.5 w-3.5" />
            End-to-end encrypted &amp; anonymous
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Report with confidence.
            <br />
            <span className="text-primary">Stay protected.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            A secure platform for reporting workplace concerns — anonymously, safely,
            and with full compliance protection.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/report">
              <Button size="lg" className="text-base px-8">
                <FileText className="h-5 w-5 mr-2" />
                Submit a Report
              </Button>
            </Link>
            <Link href="/track">
              <Button size="lg" variant="outline" className="text-base px-8">
                <Eye className="h-5 w-5 mr-2" />
                Track Your Report
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "100% Anonymous",
                desc: "No personal information collected. Your identity is never stored or tracked.",
              },
              {
                icon: Lock,
                title: "Encrypted & Secure",
                desc: "Military-grade encryption protects every submission. Zero-knowledge architecture.",
              },
              {
                icon: Eye,
                title: "Track Progress",
                desc: "Use your unique tracking ID to check the status of your report at any time.",
              },
            ].map((f) => (
              <Card key={f.title} className="border border-border">
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>SpeakSafe &copy; 2026</span>
          </div>
          <Link href="/admin/login" className="hover:text-foreground transition-colors">
            Admin Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}
