import { useAuth } from "@/contexts/AuthContext";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Shield, Users, MapPin, MessageSquare, BarChart3, ChevronRight, Star, Zap, DollarSign, Globe, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
};

const stagger = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const testimonials = [
  {
    name: "Angela Cruz",
    role: "Nurse in London",
    origin: "Philippines",
    quote: "I used to lose $15 every time I sent money home to Manila. With DollarFlow, my family gets the full amount. It's changed everything.",
    image: "https://images.unsplash.com/photo-1675186914580-94356f7c012c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwcG9ydHJhaXQlMjBzbWlsaW5nJTIwcHJvZmVzc2lvbmFsJTIwaGVhZHNob3R8ZW58MHx8fHwxNzcxNzA1MzY3fDA&ixlib=rb-4.1.0&q=85",
    rating: 5
  },
  {
    name: "Emeka Obi",
    role: "Freelance Developer",
    origin: "Nigeria",
    quote: "As a freelancer getting paid in dollars, DollarFlow's Inflation Shield saved me from losing 18% of my earnings to Naira depreciation.",
    image: "https://images.unsplash.com/photo-1675526607070-f5cbd71dde92?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwyfHxkaXZlcnNlJTIwcG9ydHJhaXQlMjBzbWlsaW5nJTIwcHJvZmVzc2lvbmFsJTIwaGVhZHNob3R8ZW58MHx8fHwxNzcxNzA1MzY3fDA&ixlib=rb-4.1.0&q=85",
    rating: 5
  },
  {
    name: "Valentina Torres",
    role: "Graphic Designer",
    origin: "Argentina",
    quote: "With Argentine Peso losing 47% in six months, keeping my savings in dollars through DollarFlow was the smartest financial decision I made.",
    image: "https://images.unsplash.com/photo-1755190897791-7040dfdb988f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwzfHxkaXZlcnNlJTIwcG9ydHJhaXQlMjBzbWlsaW5nJTIwcHJvZmVzc2lvbmFsJTIwaGVhZHNob3R8ZW58MHx8fHwxNzcxNzA1MzY3fDA&ixlib=rb-4.1.0&q=85",
    rating: 5
  }
];

const features = [
  {
    icon: Shield,
    title: "Inflation Shield",
    desc: "Auto-convert earnings to dollars the moment you receive them. Never lose purchasing power again.",
    color: "#00D395"
  },
  {
    icon: Users,
    title: "Family Vault",
    desc: "Send money home with smart allocations. Mom gets groceries, brother gets school fees. All managed from one screen.",
    color: "#0052FF"
  },
  {
    icon: MapPin,
    title: "Cash-Out Spots",
    desc: "Find local agents near your family who convert dollars to cash. The M-Pesa model, globally.",
    color: "#FFB800"
  },
  {
    icon: MessageSquare,
    title: "Chat to Pay",
    desc: "Just type 'send $50 to Mom' and it's done. Payments as simple as sending a text message.",
    color: "#FF6B9D"
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    desc: "See exactly how much you've saved in fees, track spending by category, and monitor currency trends.",
    color: "#A78BFA"
  },
  {
    icon: Zap,
    title: "Instant Transfers",
    desc: "Money arrives in 15 seconds, not 3-5 business days. Built on blockchain for speed.",
    color: "#00D395"
  }
];

const feeComparisonFallback = [
  { service: "Western Union", fee: "$14.00", time: "1-3 days", rate: "Bad", live: false },
  { service: "Bank Wire", fee: "$25-45", time: "3-5 days", rate: "Poor", live: false },
  { service: "Wise", fee: "$4.20", time: "1-2 days", rate: "Good", live: false },
  { service: "DollarFlow", fee: "$0.03", time: "~15 sec", rate: "Best", highlight: true, live: false }
];

export default function LandingPage() {
  const { login } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);

  const [feeComparison, setFeeComparison] = useState(feeComparisonFallback);
  const [liveDollarFlowFee, setLiveDollarFlowFee] = useState("$0.03");
  const [hasLiveData, setHasLiveData] = useState(false);

  useEffect(() => {
    const fetchLiveFees = async () => {
      try {
        const res = await axios.get(`${API}/fees/live`, { params: { amount: 200 } });
        const services = res.data.services;
        const mapped = services.map((s) => ({
          service: s.name,
          fee: `$${s.fee.toFixed(2)}`,
          time: s.speed,
          rate: s.rate_quality,
          highlight: s.name === "DollarFlow",
          live: s.live,
        }));
        setFeeComparison(mapped);
        const df = services.find((s) => s.name === "DollarFlow");
        if (df) setLiveDollarFlowFee(`$${df.fee.toFixed(2)}`);
        setHasLiveData(services.some((s) => s.live));
      } catch {
        // keep fallback
      }
    };
    fetchLiveFees();
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden" data-testid="landing-page">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl" data-testid="landing-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0052FF] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">DollarFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
          </div>
          <Button
            data-testid="landing-login-btn"
            onClick={login}
            className="bg-[#0052FF] hover:bg-[#0040CC] text-white rounded-full px-6 shadow-[0_0_20px_-5px_rgba(0,82,255,0.5)]"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-44 md:pb-32 hero-mesh" data-testid="hero-section">
        <motion.div style={{ y: heroY }} className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-3xl">
            <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0052FF]/10 border border-[#0052FF]/20 text-[#0052FF] text-sm font-medium mb-6">
                <Globe className="w-4 h-4" /> Now live in 50+ countries
              </span>
            </motion.div>

            <motion.h1 {...fadeUp} transition={{ duration: 0.7, delay: 0.1 }}
              className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-6"
            >
              Your dollars.{" "}
              <span className="text-[#0052FF]">Everywhere.</span>
            </motion.h1>

            <motion.p {...fadeUp} transition={{ duration: 0.7, delay: 0.2 }}
              className="text-base sm:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed"
            >
              Send money home instantly for $0.03 — not $14. Protect your earnings from inflation.
              Manage family finances from anywhere in the world.
            </motion.p>

            <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4">
              <Button
                data-testid="hero-cta-btn"
                onClick={login}
                size="lg"
                className="bg-[#0052FF] hover:bg-[#0040CC] text-white rounded-full px-8 py-6 text-base font-semibold shadow-[0_0_30px_-5px_rgba(0,82,255,0.5)] hover:shadow-[0_0_40px_-5px_rgba(0,82,255,0.7)] transition-all"
              >
                Get Started — It's Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-base border-border/50 hover:bg-secondary/50"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.4 }}
              className="flex gap-8 mt-12 pt-8 border-t border-border/50"
            >
              {[
                { value: "$48B", label: "Lost to fees annually" },
                { value: "15s", label: "Average transfer time" },
                { value: liveDollarFlowFee, label: "Average fee" }
              ].map((stat, i) => (
                <div key={i}>
                  <div className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-background" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Not just another payment app
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for people who send money across borders. Every feature solves a real problem.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                {...stagger}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-6 rounded-2xl border border-border/50 bg-card hover:border-[#0052FF]/30 transition-all feature-card"
                data-testid={`feature-card-${i}`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${feature.color}15` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fee Comparison */}
      <section id="pricing" className="py-20 md:py-32 bg-card/50" data-testid="pricing-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Sending $200 to Philippines
            </h2>
            <p className="text-base text-muted-foreground">
              See how DollarFlow compares to traditional services
              {hasLiveData && (
                <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-[#00D395]/10 text-[#00D395] text-xs font-medium">
                  <Wifi className="w-3 h-3" /> Live data
                </span>
              )}
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="rounded-2xl border border-border overflow-hidden">
            <div className="grid grid-cols-4 gap-0 p-4 text-sm font-medium text-muted-foreground border-b border-border bg-secondary/30">
              <div>Service</div>
              <div>Fee</div>
              <div>Speed</div>
              <div>Rate</div>
            </div>
            {feeComparison.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-4 gap-0 p-4 text-sm border-b border-border last:border-0 ${
                  row.highlight ? 'bg-[#0052FF]/5 border-l-2 border-l-[#0052FF]' : ''
                }`}
                data-testid={`fee-row-${i}`}
              >
                <div className={`font-medium flex items-center gap-1.5 ${row.highlight ? 'text-[#0052FF]' : 'text-foreground'}`}>
                  {row.service}
                  {row.live && <span className="w-1.5 h-1.5 rounded-full bg-[#00D395] animate-pulse" />}
                </div>
                <div className={row.highlight ? 'text-[#00D395] font-semibold' : 'text-foreground'}>{row.fee}</div>
                <div className={row.highlight ? 'text-[#00D395] font-semibold' : 'text-foreground'}>{row.time}</div>
                <div className={row.highlight ? 'text-[#00D395] font-semibold' : 'text-foreground'}>{row.rate}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-32 bg-background" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Trusted by thousands worldwide
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                {...stagger}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="p-6 rounded-2xl border border-border bg-card"
                data-testid={`testimonial-${i}`}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }, (_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#FFB800] text-[#FFB800]" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role} — {t.origin}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 border-t border-border bg-card/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm text-muted-foreground">
            {["Built on Base", "Powered by USDC", "Non-custodial", "Audited Smart Contracts"].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00D395]" />
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-background" data-testid="cta-section">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 text-center">
          <motion.div {...fadeUp}>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Start sending money for{" "}
              <span className="text-[#00D395]">{liveDollarFlowFee}</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of people who are done paying $14 fees to send money home. Set up takes 30 seconds.
            </p>
            <Button
              data-testid="cta-get-started-btn"
              onClick={login}
              size="lg"
              className="bg-[#0052FF] hover:bg-[#0040CC] text-white rounded-full px-10 py-6 text-base font-semibold shadow-[0_0_30px_-5px_rgba(0,82,255,0.5)]"
            >
              Get Started — It's Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-background" data-testid="landing-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#0052FF] flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">DollarFlow 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
