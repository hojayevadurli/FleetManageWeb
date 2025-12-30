
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Truck, 
  Wrench, 
  FileCheck, 
  MapPin, 
  ArrowRight, 
  CheckCircle,
  Camera,
  Users
} from "lucide-react";

const Landing = () => {
  const [email, setEmail] = useState("");

  const features = [
    {
      icon: Wrench,
      title: "Track All Repairs",
      description: "See your fleet's repair history in one place. Add repairs with photos and notes."
    },
    {
      icon: FileCheck,
      title: "Simple Inspections",
      description: "Do inspections from anywhere. Upload photos and get reminders automatically."
    },
    {
      icon: MapPin,
      title: "Find Good Shops",
      description: "Build a list of trusted repair shops. See ratings and past work done."
    },
    {
      icon: Camera,
      title: "Spot Issues Early",
      description: "Take a photo and get instant suggestions about potential problems."
    },
    {
      icon: Users,
      title: "Team Friendly",
      description: "Your whole team can use it. No more lost paperwork or missed updates."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Fleetmanage.ai</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Manage Your Fleet
            <br />
            <span className="text-blue-600">The Smart Way</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Everything you need to keep your trucks running smoothly. 
            Track repairs, do inspections, and manage your shop - all in one simple app.
          </p>
          
          {/* CTA */}
          <div className="max-w-md mx-auto mb-16">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex gap-4 mb-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Link to="/login">
                  <Button size="lg" className="bg-green-500 hover:bg-green-600">
                    Try Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                Free to try • Works on mobile & desktop
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg max-w-4xl mx-auto">
            <img 
              src="https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=800&h=400&fit=crop&q=80" 
              alt="Fleet Management Dashboard" 
              className="rounded-lg w-full"
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Fleet Owners Choose Us
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3 p-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
              <span className="text-gray-700">Save time on paperwork</span>
            </div>
            <div className="flex items-start space-x-3 p-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
              <span className="text-gray-700">Never miss an inspection</span>
            </div>
            <div className="flex items-start space-x-3 p-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
              <span className="text-gray-700">Keep your team connected</span>
            </div>
            <div className="flex items-start space-x-3 p-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
              <span className="text-gray-700">Find problems before they happen</span>
            </div>
            <div className="flex items-start space-x-3 p-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
              <span className="text-gray-700">Track all your repair costs</span>
            </div>
            <div className="flex items-start space-x-3 p-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
              <span className="text-gray-700">Works on any device</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600">
              Simple tools that make fleet management easy
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join fleet owners who are already saving time and money.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Try Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-blue-200 mt-4">
            No credit card required • Free to try
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold">Fleetmanage.ai</span>
              </div>
              <p className="text-gray-400">
                Smart fleet management made simple.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/login" className="hover:text-white">Features</Link></li>
                <li><Link to="/login" className="hover:text-white">Try Free</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex justify-between items-center">
            <div className="text-gray-400">
              © 2024 Fleetmanage.ai. All rights reserved.
            </div>
            <Link to="/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
