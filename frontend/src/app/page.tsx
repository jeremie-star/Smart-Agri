"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { 
  Droplets, 
  Sprout, 
  CloudRain, 
  MessageSquare, 
  BarChart3, 
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Globe,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: CloudRain,
    title: "Smart Weather Integration",
    description: "Real-time weather data and 7-day forecasts to optimize your irrigation schedule.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Droplets,
    title: "AI-Powered Irrigation",
    description: "Advanced AI analyzes your crops, soil, and weather to recommend perfect watering schedules.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: MessageSquare,
    title: "Agricultural Assistant",
    description: "24/7 AI chatbot answers your farming questions in English, Swahili, or Kinyarwanda.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Smartphone,
    title: "SMS Notifications",
    description: "Get irrigation reminders and farming tips via SMS, even without internet.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Track your irrigation history, water usage, and crop performance over time.",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Use the app in your preferred language: English, Swahili, or Kinyarwanda.",
    color: "from-teal-500 to-green-500"
  }
]

const benefits = [
  "Save up to 40% water with optimized irrigation",
  "Increase crop yields by 25-35%",
  "Get instant answers to farming questions",
  "Receive timely irrigation reminders",
  "Access anywhere via web or SMS",
  "Free for smallholder farmers"
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Droplets className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Smart Irrigation Assistant</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-green-600 hover:bg-green-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-900 dark:via-blue-900 dark:to-purple-900 py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Grow Smarter with AI-Powered Irrigation
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
                Transform your farming with intelligent water management, real-time weather insights, 
                and an AI assistant that speaks your language.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8">
                    Start Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-600 dark:text-white">
                <div className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-500 mr-2" />
                  <span>Instant Setup</span>
                </div>
                <div className="flex items-center">
                  <Smartphone className="h-4 w-4 text-blue-500 mr-2" />
                  <span>SMS Enabled</span>
                </div>
                <div className="flex items-center">
                  <Globe className="h-4 w-4 text-green-500 mr-2" />
                  <span>3 Languages</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 p-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <Droplets className="h-12 w-12 text-green-600" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Next Irrigation</div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-300">In 2 days</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <CloudRain className="h-12 w-12 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Weather Forecast</div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-300">Sunny, 28°C</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                    <MessageSquare className="h-12 w-12 text-purple-600" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">AI Assistant</div>
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-300">Always Ready</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Powerful Features for Modern Farmers</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need to optimize your irrigation and increase yields
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-2 dark:border-neutral-800 hover:border-green-200 dark:hover:border-green-700">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-gray-700 dark:text-gray-300">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Sprout className="h-16 w-16 text-green-600 mb-6" />
              <h2 className="text-4xl font-bold mb-6">
                Proven Results for East African Farmers
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
                Join thousands of farmers who are already saving water, increasing yields, 
                and getting expert advice through our AI-powered platform.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <span className="text-lg text-gray-900 dark:text-gray-200">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8"
            >
              <h3 className="text-2xl font-bold mb-6">How It Works</h3>
              <div className="space-y-6">
                <div className="flex space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Register & Add Your Farm</h4>
                    <p className="text-gray-600">Sign up with your phone number and add your farm details including crops and location.</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Get AI Recommendations</h4>
                    <p className="text-gray-600">Our AI analyzes weather, soil, and crop data to create your perfect irrigation schedule.</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Receive SMS Reminders</h4>
                    <p className="text-gray-600">Get timely notifications when it's time to water, even without internet access.</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Ask Questions Anytime</h4>
                    <p className="text-gray-600">Chat with our AI assistant for instant farming advice in your language.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Farming?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of farmers using AI to grow smarter and save water
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-green-400 dark:hover:bg-slate-700 text-lg px-12">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-4 text-sm opacity-75">
              No credit card required • Free for smallholder farmers • SMS enabled
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Droplets className="h-6 w-6 text-green-500" />
                <span className="font-bold">Smart Irrigation Assistant</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered irrigation management for sustainable farming in East Africa.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
                <li><Link href="#" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms</Link></li>
                <li><Link href="#" className="hover:text-white">License</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; 2025 Smart Irrigation Assistant. Built for East African farmers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
