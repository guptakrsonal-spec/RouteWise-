import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  Settings2, 
  MessageSquare, 
  Send,
  MapPin,
  Users,
  Clock,
  Zap,
  ShieldCheck,
  Fuel,
  IndianRupee,
  Menu,
  X,
  Bot,
  Building2,
  LogOut,
  User,
  UserCircle,
  Briefcase,
  Calendar,
  IdCard,
  Award,
  Star,
  Phone,
  Mail,
  Home,
  Navigation,
  Timer,
  CreditCard,
  HeartPulse
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { INITIAL_ROUTES, PREDICTION_DATA, Route } from './constants';
import { getRouteWiseAIResponse } from './lib/gemini';
import { cn } from './lib/utils';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export type ProfileType = 'passenger' | 'driver' | null;

export interface PassengerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  homeStop: string;
  frequentRoute: string;
  dailyCommuteTime: string;
  passType: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface DriverProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  driverId: string; // NMT-DRV-XXXX
  licenseNumber: string;
  licenseExpiry: string;
  vehicleClass: string;
  assignedRoute: string;
  busNumber: string;
  shiftTiming: string;
  depot: string;
  experienceYears: string;
  safetyCertification: string; // NMT-SAFE-YYYY
  // Read-only stats
  tripsCompleted: number;
  onTimeRate: string;
  avgRating: number;
}

export default function App() {
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Profile State
  const [profileType, setProfileType] = useState<ProfileType>(() => {
    return localStorage.getItem('routewise_profile_type') as ProfileType || null;
  });

  const [passengerProfile, setPassengerProfile] = useState<PassengerProfile>(() => {
    const saved = localStorage.getItem('routewise_passenger_profile');
    return saved ? JSON.parse(saved) : {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      homeStop: '',
      frequentRoute: '',
      dailyCommuteTime: '',
      passType: 'Monthly',
      emergencyContactName: '',
      emergencyContactPhone: ''
    };
  });

  const [driverProfile, setDriverProfile] = useState<DriverProfile>(() => {
    const saved = localStorage.getItem('routewise_driver_profile');
    const randomId = `NMT-DRV-${Math.floor(1000 + Math.random() * 9000)}`;
    const currentYear = new Date().getFullYear();
    return saved ? JSON.parse(saved) : {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      driverId: randomId,
      licenseNumber: '',
      licenseExpiry: '',
      vehicleClass: 'Heavy Commercial',
      assignedRoute: '',
      busNumber: '',
      shiftTiming: 'Morning (6 AM - 2 PM)',
      depot: 'Nagpur Central Depot',
      experienceYears: '0',
      safetyCertification: `NMT-SAFE-${currentYear}`,
      tripsCompleted: 1240,
      onTimeRate: '94.2%',
      avgRating: 4.8
    };
  });

  useEffect(() => {
    if (profileType) localStorage.setItem('routewise_profile_type', profileType);
    localStorage.setItem('routewise_passenger_profile', JSON.stringify(passengerProfile));
    localStorage.setItem('routewise_driver_profile', JSON.stringify(driverProfile));
  }, [profileType, passengerProfile, driverProfile]);

  const handleLogout = () => {
    localStorage.removeItem('routewise_profile_type');
    localStorage.removeItem('routewise_passenger_profile');
    localStorage.removeItem('routewise_driver_profile');
    localStorage.removeItem('routewise_chat_history');
    window.location.reload();
  };

  // Simulation State
  const [simRoute, setSimRoute] = useState('');
  const [simPassengers, setSimPassengers] = useState('80');
  const [simTime, setSimTime] = useState('10:00');
  const [simWeather, setSimWeather] = useState('clear');
  const [simEvent, setSimEvent] = useState('none');
  const [simResult, setSimResult] = useState<any>(null);

  // Route Management State
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [routeCity, setRouteCity] = useState('Nagpur');
  const [isSearchingRoute, setIsSearchingRoute] = useState(false);
  const [routeResult, setRouteResult] = useState<string | null>(null);

  // AI Assistant State with Persistence
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>(() => {
    const saved = localStorage.getItem('routewise_chat_history');
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: "Hello! I'm RouteWise AI. How can I help you optimize Nagpur's transport today?" }
    ];
  });

  useEffect(() => {
    localStorage.setItem('routewise_chat_history', JSON.stringify(messages));
  }, [messages]);

  const clearHistory = () => {
    const initialMessage = [{ role: 'assistant', content: "Hello! I'm RouteWise AI. How can I help you optimize Nagpur's transport today?" }];
    setMessages(initialMessage as any);
    localStorage.removeItem('routewise_chat_history');
  };

  const calculatePrediction = () => {
    const current = parseInt(simPassengers) || 0;
    let multiplier = 0;

    // Weather
    if (simWeather === 'rainy') multiplier += 0.22;
    if (simWeather === 'heavy_rain') multiplier += 0.35;

    // Events
    if (simEvent === 'sports') multiplier += 0.40;
    if (simEvent === 'festival') multiplier += 0.60;
    if (simEvent === 'exam') multiplier += 0.25;

    // Time (Rush Hour: 7-9 AM, 5-8 PM)
    const hour = parseInt(simTime.split(':')[0]);
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 20)) {
      multiplier += 0.50;
    } else if (hour >= 21 || hour < 5) {
      multiplier -= 0.40;
    }

    const predicted = Math.round(current * (1 + multiplier));
    const loadFactor = (predicted / 120) * 100;
    const busesNeeded = Math.ceil(predicted / 120);

    let status = 'OPTIMAL ✅';
    if (loadFactor > 100) status = 'OVERCROWDED 🚨';
    else if (loadFactor > 80) status = 'NEAR CAPACITY ⚠️';
    else if (loadFactor < 50) status = 'UNDERUTILIZED 💤';

    let recommendation = 'Maintain current frequency';
    if (loadFactor > 100) recommendation = `Deploy ${busesNeeded} buses immediately`;
    else if (loadFactor < 50) recommendation = 'Reduce frequency to save fuel';

    setSimResult({
      predicted,
      loadFactor: loadFactor.toFixed(1),
      status,
      busesNeeded,
      recommendation
    });
  };

  const handleRouteSearch = async () => {
    if (!routeFrom.trim() || !routeTo.trim() || !routeCity.trim()) return;
    
    setIsSearchingRoute(true);
    setRouteResult(null);
    
    const prompt = `Find route from ${routeFrom} to ${routeTo} in ${routeCity}`;
    const context = `Current system time: ${new Date().toLocaleTimeString()}. Routes: ${JSON.stringify(routes)}`;
    
    try {
      const response = await getRouteWiseAIResponse(prompt, context);
      setRouteResult(response);
    } catch (error) {
      console.error("Route Search Error:", error);
      setRouteResult("Error finding route. Please try again.");
    } finally {
      setIsSearchingRoute(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    const context = `Current routes: ${JSON.stringify(routes)}`;
    const response = await getRouteWiseAIResponse(userMessage, context);
    
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OVERCROWDED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'NEAR_CAPACITY': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'OPTIMAL': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'UNDERUTILIZED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-slate-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="border-r border-white/5 bg-[#0F0F12] flex flex-col z-50"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bus className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-xl tracking-tight text-white"
            >
              RouteWise<span className="text-indigo-500">AI</span>
            </motion.span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Live Dashboard' },
            { id: 'routes', icon: MapPin, label: 'Route Management' },
            { id: 'predictions', icon: TrendingUp, label: 'AI Predictions' },
            { id: 'ai-assistant', icon: Bot, label: 'AI Assistant' },
            { id: 'settings', icon: Settings2, label: 'System Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                activeTab === item.id 
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-indigo-400" : "group-hover:text-slate-200")} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl bg-white/5",
            !isSidebarOpen && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-200">NIT Nagpur Team</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Operator Mode</span>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-20 border-bottom border-white/5 bg-[#0F0F12]/50 backdrop-blur-xl flex items-center justify-between px-8 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-400" />
            </button>
            <h1 className="text-lg font-semibold text-white capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider">System Live</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-slate-200">Nagpur Municipal</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Transport Authority</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            {activeTab === 'dashboard' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Overcrowding Reduction', value: '35%', icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                    { label: 'Fuel Savings', value: '28%', icon: Fuel, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { label: 'Annual Savings', value: '₹2.4Cr', icon: IndianRupee, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { label: 'Wait Time Reduction', value: '18m', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-[#15151A] border-white/5 hover:border-white/10 transition-all group">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn("p-2 rounded-lg", stat.bg)}>
                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                          </div>
                          <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500 uppercase tracking-wider">Live Data</Badge>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
                          <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Live Routes */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Bus className="w-5 h-5 text-indigo-500" />
                        Live Route Status
                      </h2>
                      <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10">
                        View All Routes
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {routes.map((route) => (
                        <Card key={route.id} className="bg-[#15151A] border-white/5 hover:border-white/10 transition-all overflow-hidden group">
                          <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row md:items-center">
                              <div className="p-6 flex-1">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-indigo-400 font-bold">
                                      {route.id}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-white">{route.from} ↔ {route.to}</h4>
                                      <p className="text-xs text-slate-500">{route.name}</p>
                                    </div>
                                  </div>
                                  <Badge className={cn("px-2.5 py-0.5 border", getStatusColor(route.status))}>
                                    {route.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Passengers</p>
                                    <p className="text-sm font-semibold text-slate-200">{route.passengers} / {route.capacity}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Load Factor</p>
                                    <p className="text-sm font-semibold text-slate-200">{route.loadFactor.toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">AI Recommendation</p>
                                    <p className="text-sm font-semibold text-indigo-400">{route.recommendation}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="h-2 md:h-full md:w-2 bg-white/5 flex-shrink-0">
                                <div 
                                  className={cn(
                                    "h-full w-full transition-all duration-500",
                                    route.loadFactor > 100 ? "bg-red-500" : 
                                    route.loadFactor > 80 ? "bg-amber-500" : "bg-emerald-500"
                                  )}
                                  style={{ height: `${Math.min(route.loadFactor, 100)}%` }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Demand Prediction Chart */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-indigo-500" />
                      Demand Forecast
                    </h2>
                    <Card className="bg-[#15151A] border-white/5 p-6 h-[400px]">
                      <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-sm font-medium text-slate-400">24-Hour Passenger Load Prediction</CardTitle>
                        <CardDescription className="text-[10px] text-slate-600 uppercase tracking-widest">LSTM Neural Network Output</CardDescription>
                      </CardHeader>
                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={PREDICTION_DATA}>
                            <defs>
                              <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis 
                              dataKey="time" 
                              stroke="#475569" 
                              fontSize={10} 
                              tickLine={false} 
                              axisLine={false}
                            />
                            <YAxis 
                              stroke="#475569" 
                              fontSize={10} 
                              tickLine={false} 
                              axisLine={false}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#15151A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                              itemStyle={{ color: '#6366f1' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="demand" 
                              stroke="#6366f1" 
                              strokeWidth={2}
                              fillOpacity={1} 
                              fill="url(#colorDemand)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* AI Alerts */}
                    <div className="space-y-3">
                      <Alert className="bg-red-500/5 border-red-500/20 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-bold uppercase tracking-wider">Critical Alert</AlertTitle>
                        <AlertDescription className="text-xs opacity-80">
                          Route 12 is experiencing 22% higher demand than predicted.
                        </AlertDescription>
                      </Alert>
                      <Alert className="bg-emerald-500/5 border-emerald-500/20 text-emerald-400">
                        <ShieldCheck className="h-4 w-4" />
                        <AlertTitle className="text-xs font-bold uppercase tracking-wider">Optimization Success</AlertTitle>
                        <AlertDescription className="text-xs opacity-80">
                          Route 21 frequency reduction saved 14L of fuel in last 4h.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'routes' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Smart Route Management</h2>
                    <p className="text-slate-500">Find the best bus routes across Nagpur with real-time crowd insights.</p>
                  </div>
                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1">
                    Passenger Mode
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Search Form */}
                  <Card className="bg-[#15151A] border-white/5 shadow-2xl h-fit">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-indigo-500" />
                        Plan Your Journey
                      </CardTitle>
                      <CardDescription>Enter your locations to find the optimal route.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-slate-300 font-semibold">City</Label>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input 
                              id="city" 
                              placeholder="e.g. Nagpur" 
                              value={routeCity}
                              onChange={(e) => setRouteCity(e.target.value)}
                              className="bg-[#0A0A0B] border-white/10 text-white pl-12 h-12"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="from" className="text-slate-300 font-semibold">Starting Point</Label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input 
                              id="from" 
                              placeholder="e.g. Sitabuldi" 
                              value={routeFrom}
                              onChange={(e) => setRouteFrom(e.target.value)}
                              className="bg-[#0A0A0B] border-white/10 text-white pl-12 h-12"
                            />
                          </div>
                        </div>
                        <div className="flex justify-center -my-2 relative z-10">
                          <div className="bg-indigo-600/20 p-2 rounded-full border border-indigo-500/30">
                            <TrendingUp className="w-4 h-4 text-indigo-400 rotate-90" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="to" className="text-slate-300 font-semibold">Destination</Label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input 
                              id="to" 
                              placeholder="e.g. Koradi" 
                              value={routeTo}
                              onChange={(e) => setRouteTo(e.target.value)}
                              className="bg-[#0A0A0B] border-white/10 text-white pl-12 h-12"
                            />
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={handleRouteSearch}
                        disabled={isSearchingRoute || !routeFrom.trim() || !routeTo.trim() || !routeCity.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-7 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                      >
                        {isSearchingRoute ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Searching...
                          </div>
                        ) : (
                          <>
                            <Bus className="w-5 h-5 mr-2" />
                            Find Best Route
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Results Area */}
                  <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence mode="wait">
                      {routeResult ? (
                        <motion.div
                          key="route-result"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6"
                        >
                          <Card className="bg-[#15151A] border-indigo-500/30 border-2 overflow-hidden shadow-2xl">
                            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                  <MapPin className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-widest text-white">Route Analysis Found</span>
                              </div>
                              <Badge className="bg-white/20 text-white border-none">AI Powered</Badge>
                            </div>
                            <CardContent className="p-8">
                              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-200 bg-[#0A0A0B] p-6 rounded-xl border border-white/5 shadow-inner">
                                {routeResult}
                              </div>
                              
                              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Safe Travel</p>
                                    <p className="text-xs font-bold text-white">Verified Route</p>
                                  </div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <IndianRupee className="w-5 h-5 text-blue-400" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Economy</p>
                                    <p className="text-xs font-bold text-white">Best Fare</p>
                                  </div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-amber-400" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Speed</p>
                                    <p className="text-xs font-bold text-white">Direct Path</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-3xl p-16 text-center space-y-6 bg-white/[0.02]">
                          <div className="w-24 h-24 rounded-full bg-indigo-500/5 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10 animate-ping" />
                            <MapPin className="w-12 h-12 text-indigo-500/20" />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-slate-400">Ready to Navigate</p>
                            <p className="text-sm max-w-[320px] text-slate-500 mt-2">Enter your starting point and destination to generate a smart route with real-time crowd analysis.</p>
                          </div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'predictions' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">AI Prediction Engine</h2>
                    <p className="text-slate-500">Advanced demand forecasting and simulation using LSTM neural networks.</p>
                  </div>
                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1">
                    AI Engine Active
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Input Form */}
                  <Card className="bg-[#15151A] border-white/5 shadow-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-indigo-500" />
                        Scenario Parameters
                      </CardTitle>
                      <CardDescription>Configure environmental variables to simulate passenger load.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="route" className="text-slate-300 font-semibold">Route Name / ID</Label>
                        <Input 
                          id="route" 
                          placeholder="e.g. Route 12 (Sitabuldi ↔ Koradi)" 
                          value={simRoute}
                          onChange={(e) => setSimRoute(e.target.value)}
                          className="bg-[#0A0A0B] border-white/10 text-white placeholder:text-slate-600 h-12"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="passengers" className="text-slate-300 font-semibold">Current Passengers</Label>
                          <Input 
                            id="passengers" 
                            type="number" 
                            value={simPassengers}
                            onChange={(e) => setSimPassengers(e.target.value)}
                            className="bg-[#0A0A0B] border-white/10 text-white h-12"
                          />
                          <p className="text-[10px] text-slate-500 leading-tight">Baseline passenger count for the simulation.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time" className="text-slate-300 font-semibold">Time of Day</Label>
                          <Input 
                            id="time" 
                            type="time" 
                            value={simTime}
                            onChange={(e) => setSimTime(e.target.value)}
                            className="bg-[#0A0A0B] border-white/10 text-white h-12"
                          />
                          <p className="text-[10px] text-slate-500 leading-tight">Peak hours (7-9 AM, 5-8 PM) add a 50% demand surge.</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300 font-semibold">Weather Conditions</Label>
                        <Select value={simWeather} onValueChange={setSimWeather}>
                          <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-white h-12">
                            <SelectValue placeholder="Select weather" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#15151A] border-white/10 text-white">
                            <SelectItem value="clear">Clear Skies</SelectItem>
                            <SelectItem value="rainy">Rainy Weather (+22%)</SelectItem>
                            <SelectItem value="heavy_rain">Heavy Rain (+35%)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-slate-500 leading-tight">Adverse weather shifts commuters from two-wheelers to buses.</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300 font-semibold">Nearby Events</Label>
                        <Select value={simEvent} onValueChange={setSimEvent}>
                          <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-white h-12">
                            <SelectValue placeholder="Select event" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#15151A] border-white/10 text-white">
                            <SelectItem value="none">No Special Events</SelectItem>
                            <SelectItem value="sports">Sports Match (+40%)</SelectItem>
                            <SelectItem value="festival">Festival (+60%)</SelectItem>
                            <SelectItem value="exam">Exam Day (+25%)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-slate-500 leading-tight">Major events create massive localized demand spikes.</p>
                      </div>

                      <Button 
                        onClick={calculatePrediction}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-7 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        Run AI Prediction
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Results Display */}
                  <div className="space-y-6">
                    <AnimatePresence mode="wait">
                      {simResult ? (
                        <motion.div
                          key="result"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="space-y-6"
                        >
                          <Card className="bg-[#15151A] border-indigo-500/30 border-2 overflow-hidden shadow-2xl">
                            <div className="bg-indigo-600 px-6 py-3 flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-widest text-white/90">Prediction Analysis</span>
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                            <CardContent className="p-8 space-y-8">
                              <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Predicted Passengers</p>
                                  <p className="text-5xl font-black text-white tracking-tighter">{simResult.predicted}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Load Factor</p>
                                  <p className={cn(
                                    "text-5xl font-black tracking-tighter",
                                    parseFloat(simResult.loadFactor) > 100 ? "text-red-500" : "text-emerald-500"
                                  )}>{simResult.loadFactor}%</p>
                                </div>
                              </div>

                              <Separator className="bg-white/5" />

                              <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-slate-400">System Status</span>
                                  <Badge className={cn("px-4 py-1.5 text-xs font-bold uppercase tracking-wider", getStatusColor(simResult.status.split(' ')[0]))}>
                                    {simResult.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-slate-400">Buses Needed</span>
                                  <div className="flex items-center gap-2">
                                    <Bus className="w-5 h-5 text-indigo-400" />
                                    <span className="text-2xl font-black text-white">{simResult.busesNeeded}</span>
                                  </div>
                                </div>
                              </div>

                              <Alert className="bg-indigo-500/10 border-indigo-500/20 mt-4 py-5">
                                <TrendingUp className="h-6 w-6 text-indigo-400" />
                                <div className="ml-2">
                                  <AlertTitle className="text-indigo-400 font-bold uppercase tracking-wider text-xs mb-1">AI Recommendation</AlertTitle>
                                  <AlertDescription className="text-slate-100 font-semibold text-base leading-tight">
                                    {simResult.recommendation}
                                  </AlertDescription>
                                </div>
                              </Alert>
                            </CardContent>
                          </Card>

                          <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-white/5 border-white/5 p-5 flex items-center gap-4 hover:bg-white/10 transition-colors">
                              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Confidence</p>
                                <p className="text-lg font-black text-white">98.4%</p>
                              </div>
                            </Card>
                            <Card className="bg-white/5 border-white/5 p-5 flex items-center gap-4 hover:bg-white/10 transition-colors">
                              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Latency</p>
                                <p className="text-lg font-black text-white">124ms</p>
                              </div>
                            </Card>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-3xl p-16 text-center space-y-6 bg-white/[0.02]">
                          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center animate-pulse">
                            <TrendingUp className="w-10 h-10 opacity-20" />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-slate-400">Awaiting Simulation Data</p>
                            <p className="text-sm max-w-[280px] text-slate-500 mt-2">Configure the scenario parameters on the left to generate a high-precision demand prediction.</p>
                          </div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'ai-assistant' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-[calc(100vh-12rem)] flex flex-col max-w-4xl mx-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">RouteWise AI Assistant</h2>
                    <p className="text-slate-500">Your intelligent partner for transport optimization and demand prediction.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearHistory}
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    Clear History
                  </Button>
                </div>

                <Card className="flex-1 bg-[#15151A] border-white/5 flex flex-col overflow-hidden">
                  <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                    <div className="space-y-6">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn(
                          "flex flex-col max-w-[80%]",
                          msg.role === 'user' ? "ml-auto items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "px-6 py-3 rounded-2xl text-sm leading-relaxed",
                            msg.role === 'user' 
                              ? "bg-indigo-600 text-white rounded-tr-none" 
                              : "bg-white/5 text-slate-200 border border-white/10 rounded-tl-none"
                          )}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-slate-600 mt-2 px-1 font-medium uppercase tracking-wider">
                            {msg.role === 'user' ? 'Operator' : 'RouteWise AI'}
                          </span>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex items-center gap-3 text-slate-500 px-2">
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 bg-indigo-500/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-indigo-500/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-indigo-500/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/60">AI is thinking...</span>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="p-6 border-t border-white/5 bg-white/5">
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Enter starting point, destination, and city (e.g., Sitabuldi to Koradi in Nagpur)..."
                        className="flex-1 bg-[#0A0A0B] border border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={isTyping || !input.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 h-auto px-8 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                      >
                        <Send className="w-5 h-5 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">System Settings & Profile</h2>
                    <p className="text-slate-500">Manage your account details and application preferences.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>

                {!profileType ? (
                  <Card className="bg-[#15151A] border-white/5 p-12 text-center space-y-8">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">Choose Your Profile Type</h3>
                      <p className="text-slate-500">Select how you will be using RouteWise AI to get the best experience.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button 
                        onClick={() => setProfileType('passenger')}
                        className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group text-left space-y-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <User className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-lg">Passenger</h4>
                          <p className="text-sm text-slate-500">Find routes, check crowd levels, and manage your daily commute.</p>
                        </div>
                      </button>
                      <button 
                        onClick={() => setProfileType('driver')}
                        className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group text-left space-y-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Briefcase className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-lg">Transport Driver</h4>
                          <p className="text-sm text-slate-500">Manage your assigned routes, view shift timings, and track performance.</p>
                        </div>
                      </button>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        profileType === 'passenger' ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {profileType === 'passenger' ? <User className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white capitalize">{profileType} Profile</h3>
                        <p className="text-xs text-slate-500">You are currently logged in as a {profileType}.</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setProfileType(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        Change Type
                      </Button>
                    </div>

                    {profileType === 'passenger' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="bg-[#15151A] border-white/5">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <UserCircle className="w-5 h-5 text-indigo-400" />
                              Personal Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-slate-400">First Name</Label>
                                <Input 
                                  value={passengerProfile.firstName}
                                  onChange={(e) => setPassengerProfile({...passengerProfile, firstName: e.target.value})}
                                  className="bg-[#0A0A0B] border-white/10 text-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-400">Last Name</Label>
                                <Input 
                                  value={passengerProfile.lastName}
                                  onChange={(e) => setPassengerProfile({...passengerProfile, lastName: e.target.value})}
                                  className="bg-[#0A0A0B] border-white/10 text-white"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400">Email Address</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <Input 
                                  type="email"
                                  value={passengerProfile.email}
                                  onChange={(e) => setPassengerProfile({...passengerProfile, email: e.target.value})}
                                  className="bg-[#0A0A0B] border-white/10 text-white pl-10"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400">Phone Number</Label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <Input 
                                  value={passengerProfile.phone}
                                  onChange={(e) => setPassengerProfile({...passengerProfile, phone: e.target.value})}
                                  className="bg-[#0A0A0B] border-white/10 text-white pl-10"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-[#15151A] border-white/5">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Navigation className="w-5 h-5 text-indigo-400" />
                              Commute Preferences
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-slate-400">Home Bus Stop</Label>
                              <div className="relative">
                                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <Input 
                                  value={passengerProfile.homeStop}
                                  onChange={(e) => setPassengerProfile({...passengerProfile, homeStop: e.target.value})}
                                  className="bg-[#0A0A0B] border-white/10 text-white pl-10"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400">Frequent Route</Label>
                              <Input 
                                value={passengerProfile.frequentRoute}
                                onChange={(e) => setPassengerProfile({...passengerProfile, frequentRoute: e.target.value})}
                                className="bg-[#0A0A0B] border-white/10 text-white"
                                placeholder="e.g. Route 12"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-slate-400">Commute Time</Label>
                                <div className="relative">
                                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                  <Input 
                                    type="time"
                                    value={passengerProfile.dailyCommuteTime}
                                    onChange={(e) => setPassengerProfile({...passengerProfile, dailyCommuteTime: e.target.value})}
                                    className="bg-[#0A0A0B] border-white/10 text-white pl-10"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-400">Pass Type</Label>
                                <Select 
                                  value={passengerProfile.passType} 
                                  onValueChange={(val) => setPassengerProfile({...passengerProfile, passType: val})}
                                >
                                  <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#15151A] border-white/10 text-white">
                                    <SelectItem value="Daily">Daily Ticket</SelectItem>
                                    <SelectItem value="Weekly">Weekly Pass</SelectItem>
                                    <SelectItem value="Monthly">Monthly Pass</SelectItem>
                                    <SelectItem value="Student">Student Pass</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-[#15151A] border-white/5 md:col-span-2">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <HeartPulse className="w-5 h-5 text-red-400" />
                              Emergency Contact
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-slate-400">Contact Name</Label>
                              <Input 
                                value={passengerProfile.emergencyContactName}
                                onChange={(e) => setPassengerProfile({...passengerProfile, emergencyContactName: e.target.value})}
                                className="bg-[#0A0A0B] border-white/10 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400">Contact Phone</Label>
                              <Input 
                                value={passengerProfile.emergencyContactPhone}
                                onChange={(e) => setPassengerProfile({...passengerProfile, emergencyContactPhone: e.target.value})}
                                className="bg-[#0A0A0B] border-white/10 text-white"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="bg-[#15151A] border-white/5">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <IdCard className="w-5 h-5 text-emerald-400" />
                              Professional Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-slate-400">First Name</Label>
                                <Input 
                                  value={driverProfile.firstName}
                                  onChange={(e) => setDriverProfile({...driverProfile, firstName: e.target.value})}
                                  className="bg-[#0A0A0B] border-white/10 text-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-400">Last Name</Label>
                                <Input 
                                  value={driverProfile.lastName}
                                  onChange={(e) => setDriverProfile({...driverProfile, lastName: e.target.value})}
                                  className="bg-[#0A0A0B] border-white/10 text-white"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-slate-400">Driver ID</Label>
                                <Input 
                                  value={driverProfile.driverId}
                                  readOnly
                                  className="bg-[#0A0A0B] border-white/10 text-slate-500 cursor-not-allowed"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-400">Safety Cert</Label>
                                <Input 
                                  value={driverProfile.safetyCertification}
                                  readOnly
                                  className="bg-[#0A0A0B] border-white/10 text-slate-500 cursor-not-allowed"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400">License Number</Label>
                              <Input 
                                value={driverProfile.licenseNumber}
                                onChange={(e) => setDriverProfile({...driverProfile, licenseNumber: e.target.value})}
                                className="bg-[#0A0A0B] border-white/10 text-white"
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-[#15151A] border-white/5">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Bus className="w-5 h-5 text-emerald-400" />
                              Assignment & Vehicle
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-slate-400">Assigned Route</Label>
                                <Input 
                                  value={driverProfile.assignedRoute}
                                  onChange={(e) => setDriverProfile({...driverProfile, assignedRoute: e.target.value})}
                                  className="bg-[#0A0A0B] border-white/10 text-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-400">Bus Number</Label>
                                <Input 
                                  value={driverProfile.busNumber}
                                  onChange={(e) => setDriverProfile({...driverProfile, busNumber: e.target.value})}
                                  className="bg-[#0A0A0B] border-white/10 text-white"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400">Shift Timing</Label>
                              <Select 
                                value={driverProfile.shiftTiming} 
                                onValueChange={(val) => setDriverProfile({...driverProfile, shiftTiming: val})}
                              >
                                <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#15151A] border-white/10 text-white">
                                  <SelectItem value="Morning (6 AM - 2 PM)">Morning (6 AM - 2 PM)</SelectItem>
                                  <SelectItem value="Afternoon (2 PM - 10 PM)">Afternoon (2 PM - 10 PM)</SelectItem>
                                  <SelectItem value="Night (10 PM - 6 AM)">Night (10 PM - 6 AM)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-400">Depot</Label>
                              <Input 
                                value={driverProfile.depot}
                                onChange={(e) => setDriverProfile({...driverProfile, depot: e.target.value})}
                                className="bg-[#0A0A0B] border-white/10 text-white"
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-[#15151A] border-white/5 md:col-span-2">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Award className="w-5 h-5 text-amber-400" />
                              Performance Stats (Read-only)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <Navigation className="w-5 h-5 text-indigo-400" />
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Trips Completed</p>
                                <p className="text-xl font-black text-white">{driverProfile.tripsCompleted}</p>
                              </div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Timer className="w-5 h-5 text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">On-Time Rate</p>
                                <p className="text-xl font-black text-white">{driverProfile.onTimeRate}</p>
                              </div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Star className="w-5 h-5 text-amber-400" />
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Avg Rating</p>
                                <p className="text-xl font-black text-white">{driverProfile.avgRating}/5.0</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-xl font-bold shadow-lg shadow-indigo-500/20">
                        Save Profile Changes
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Removed Floating Chat Assistant */}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
