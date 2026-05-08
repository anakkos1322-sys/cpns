"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { 
  BookOpen, 
  Brain, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Target,
  Trophy,
  Sparkles
} from "lucide-react"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function LandingPage() {
  const categories = [
    {
      title: "TWK",
      fullName: "Tes Wawasan Kebangsaan",
      description: "Menguji pemahaman tentang Pancasila, UUD 1945, NKRI, dan Bhinneka Tunggal Ika",
      icon: BookOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      questions: 30,
      passingScore: 65,
    },
    {
      title: "TIU",
      fullName: "Tes Intelegensi Umum",
      description: "Mengukur kemampuan verbal, numerik, dan penalaran logis",
      icon: Brain,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      questions: 35,
      passingScore: 80,
    },
    {
      title: "TKP",
      fullName: "Tes Karakteristik Pribadi",
      description: "Menilai integritas, profesionalisme, dan orientasi pelayanan",
      icon: Users,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      questions: 45,
      passingScore: 166,
    },
  ]

  const features = [
    {
      icon: Clock,
      title: "Simulasi Waktu Nyata",
      description: "Timer countdown seperti CAT CPNS asli"
    },
    {
      icon: Target,
      title: "Soal Berkualitas",
      description: "Bank soal terstandar dengan pembahasan lengkap"
    },
    {
      icon: Trophy,
      title: "Skor Instan",
      description: "Hasil dan analisis langsung setelah tes"
    },
    {
      icon: CheckCircle2,
      title: "Pembahasan Detail",
      description: "Penjelasan untuk setiap jawaban"
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="flex flex-col items-center text-center max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="h-4 w-4" />
              Simulasi CAT CPNS Terbaik
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance"
            >
              Persiapkan Dirimu untuk{" "}
              <span className="text-primary">Tes CPNS</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl text-pretty"
            >
              Platform simulasi tes CPNS online dengan sistem CAT. 
              Latihan soal TWK, TIU, dan TKP dengan pembahasan lengkap dan skor instan.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="mt-8 flex flex-col sm:flex-row gap-4"
            >
              <Button asChild size="lg" className="rounded-full px-8 h-12 text-base">
                <Link href="/test">
                  Mulai Tes Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 text-base">
                <Link href="/admin">
                  Dashboard Admin
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={fadeInUp}
              className="mt-16 grid grid-cols-3 gap-8 md:gap-16"
            >
              {[
                { value: "110", label: "Total Soal" },
                { value: "100", label: "Menit" },
                { value: "3", label: "Kategori" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Kategori Tes CPNS
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Tiga kategori tes yang harus dikuasai untuk lulus seleksi CPNS
            </p>
          </motion.div>

          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {categories.map((category) => (
              <motion.div key={category.title} variants={fadeInUp}>
                <Card className="h-full border-border/50 bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className={`inline-flex p-3 rounded-xl ${category.bgColor} mb-4`}>
                      <category.icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">{category.title}</h3>
                    <p className="text-sm text-primary font-medium mt-1">{category.fullName}</p>
                    <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                      {category.description}
                    </p>
                    <div className="mt-6 pt-4 border-t border-border flex justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">Jumlah Soal</span>
                        <p className="font-semibold text-foreground">{category.questions} Soal</p>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">Passing Grade</span>
                        <p className="font-semibold text-foreground">{category.passingScore}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Fitur Unggulan
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Semua yang kamu butuhkan untuk persiapan tes CPNS
            </p>
          </motion.div>

          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="h-full border-border/50 bg-card hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Siap Menghadapi Tes CPNS?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Mulai latihan sekarang dan tingkatkan peluangmu untuk lulus seleksi CPNS
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full px-8 h-12 text-base">
              <Link href="/test">
                Mulai Tes Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Simulasi CAT CPNS - Platform Latihan Tes CPNS Online</p>
        </div>
      </footer>
    </div>
  )
}
