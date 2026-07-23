import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();

  // If user is already logged in, redirect them to the dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-slate-50 selection:bg-blue-200 selection:text-blue-900 font-sans min-h-screen text-slate-900">
      {/* Top Nav Bar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100">
        <nav className="flex justify-between items-center px-6 md:px-10 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">LifeOS</div>
          </div>
          <div className="hidden md:flex gap-8 items-center font-medium text-slate-500 text-sm">
            <Link className="hover:text-slate-900 transition-colors" href="#">Home</Link>
            <Link className="hover:text-slate-900 transition-colors" href="#features">Features</Link>
            <Link className="hover:text-slate-900 transition-colors" href="#stats">Stats</Link>
            <Link className="hover:text-slate-900 transition-colors" href="#how-it-works">How it Works</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors hidden md:block">
              Sign In
            </Link>
            <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-28 overflow-hidden bg-slate-50">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center px-6 md:px-10">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'100%25\\' height=\\'100%25\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M0,200 C150,300 350,100 500,200 C650,300 850,100 1000,200 C1150,300 1350,100 1500,200 L1500,0 L0,0 Z\\' fill=\\'none\\' stroke=\\'%23000\\' stroke-width=\\'2\\'/%3E%3C/svg%3E')", backgroundSize: "cover", backgroundPosition: "center" }}>
          </div>
          <div className="max-w-7xl mx-auto w-full flex flex-col items-center text-center relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full border border-blue-100">
              <span className="material-symbols-outlined text-[16px]">show_chart</span>
              <span className="text-xs font-semibold tracking-wide">AI-Powered Health Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight max-w-4xl">
              Your Personal AI Health<br />Operating System
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Monitor your health, chat with AI, track fitness, manage medications, analyze wellness trends, and improve your lifestyle—all in one intelligent platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-3.5 rounded-full font-semibold shadow-lg shadow-blue-500/25 hover:-translate-y-1 transition-all flex items-center gap-2 justify-center">
                Get Started Free <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <button className="bg-white text-slate-900 border border-slate-200 px-8 py-3.5 rounded-full font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 justify-center shadow-sm">
                <span className="material-symbols-outlined text-[20px] text-blue-600">play_circle</span> Watch Demo
              </button>
            </div>

            {/* Dashboard Preview Card */}
            <div className="mt-16 w-full max-w-5xl mx-auto relative perspective-1000">
              <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] shadow-2xl p-6 transform hover:scale-[1.02] transition-transform duration-500">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="w-full md:w-1/3 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="text-sm font-semibold opacity-90">Health Score</div>
                    <div className="text-5xl font-bold mt-2">95<span className="text-xl opacity-70">/100</span></div>
                    <div className="mt-4 w-full h-1.5 bg-white/30 rounded-full">
                      <div className="w-[95%] h-full bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/3 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative">
                    <div className="text-sm font-semibold text-slate-500">Heart Rate</div>
                    <div className="text-4xl font-bold text-slate-900 mt-2">72 <span className="text-lg text-slate-400 font-normal">bpm</span></div>
                    <span className="material-symbols-outlined text-red-500 absolute top-6 right-6">favorite</span>
                    <div className="flex items-end gap-1.5 mt-6 h-12">
                      <div className="w-full bg-red-200 h-[40%] rounded-t-sm"></div>
                      <div className="w-full bg-red-400 h-[70%] rounded-t-sm"></div>
                      <div className="w-full bg-red-300 h-[50%] rounded-t-sm"></div>
                      <div className="w-full bg-red-500 h-[90%] rounded-t-sm"></div>
                      <div className="w-full bg-red-400 h-[60%] rounded-t-sm"></div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/3 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative">
                    <div className="text-sm font-semibold text-slate-500">Sleep</div>
                    <div className="text-4xl font-bold text-slate-900 mt-2">7h 42m</div>
                    <span className="material-symbols-outlined text-purple-500 absolute top-6 right-6">bedtime</span>
                    <div className="text-xs text-slate-400 mt-6">Deep sleep 32% · Quality 88%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 md:px-10 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="text-blue-600 font-bold tracking-widest text-sm mb-4 uppercase">Features</div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Everything your health needs, in one place</h2>
              <p className="text-lg text-slate-500">Six intelligent modules working together to keep you healthier, every single day.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-[24px] p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6">
                  <span className="material-symbols-outlined text-[28px]">smart_toy</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">AI Health Assistant</h3>
                <p className="text-slate-500 leading-relaxed">Smart medical guidance with conversational AI chat for personalized recommendations tuned to your body.</p>
              </div>
              <div className="bg-slate-50 rounded-[24px] p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 mb-6">
                  <span className="material-symbols-outlined text-[28px]">monitor_heart</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Health Monitoring</h3>
                <p className="text-slate-500 leading-relaxed">Track heart rate, blood pressure, sleep, oxygen levels, and daily wellness in real time.</p>
              </div>
              <div className="bg-slate-50 rounded-[24px] p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-500 mb-6">
                  <span className="material-symbols-outlined text-[28px]">fitness_center</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">AI Fitness Coach</h3>
                <p className="text-slate-500 leading-relaxed">Personalized workout plans, step tracking, calorie insights, and goal monitoring that adapts to you.</p>
              </div>
              <div className="bg-slate-50 rounded-[24px] p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-6">
                  <span className="material-symbols-outlined text-[28px]">coronavirus</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Symptom Checker</h3>
                <p className="text-slate-500 leading-relaxed">Instantly check your symptoms with our AI triage system to know when you should see a doctor.</p>
              </div>
              <div className="bg-slate-50 rounded-[24px] p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-600 mb-6">
                  <span className="material-symbols-outlined text-[28px]">restaurant</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Nutrition Planner</h3>
                <p className="text-slate-500 leading-relaxed">Log meals and get AI-generated nutrition plans designed to help you hit your optimal macros.</p>
              </div>
              <div className="bg-slate-50 rounded-[24px] p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 mb-6">
                  <span className="material-symbols-outlined text-[28px]">folder_managed</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Medical Records</h3>
                <p className="text-slate-500 leading-relaxed">Securely store, organize and analyze all your blood tests, MRI scans, and doctors notes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-24 px-6 md:px-10 bg-slate-50">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-12">Why choose LifeOS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <div className="text-5xl font-extrabold text-cyan-500 mb-2">98%</div>
                <div className="text-slate-500 font-semibold">AI Accuracy</div>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <div className="text-5xl font-extrabold text-blue-600 mb-2">50,000+</div>
                <div className="text-slate-500 font-semibold">Active Users</div>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <div className="text-5xl font-extrabold text-blue-500 mb-2">1M+</div>
                <div className="text-slate-500 font-semibold">AI Consultations</div>
              </div>
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <div className="text-5xl font-extrabold text-blue-400 mb-2">24/7</div>
                <div className="text-slate-500 font-semibold">AI Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 px-6 md:px-10 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-blue-600 font-bold tracking-widest text-sm mb-4 uppercase">How it works</div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-16">Healthier in four simple steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-slate-100 z-0"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-blue-500/30">1</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Connect your health data</h3>
                <p className="text-slate-500">Sync wearables, apps, and records in minutes.</p>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-blue-500/30">2</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">AI analyzes your wellness</h3>
                <p className="text-slate-500">Patterns and risks surface automatically.</p>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-cyan-500 text-white flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-cyan-500/30">3</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Receive recommendations</h3>
                <p className="text-slate-500">Clear, actionable guidance daily.</p>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-teal-500 text-white flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-teal-500/30">4</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Improve every day</h3>
                <p className="text-slate-500">Watch your health score climb over time.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-16 px-6 md:px-10 text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </div>
            <div className="text-xl font-bold text-white tracking-tight">LifeOS</div>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link className="hover:text-white transition-colors" href="#">Privacy Policy</Link>
            <Link className="hover:text-white transition-colors" href="#">Terms of Service</Link>
            <Link className="hover:text-white transition-colors" href="#">Contact Us</Link>
          </div>
          <div className="text-sm">
            &copy; 2026 LifeOS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
