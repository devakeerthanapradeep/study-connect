import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChefHat, Search, Heart, Calendar } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <ChefHat className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Discover & Share Amazing Recipes
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join our community of food lovers. Share your culinary creations, discover new dishes, and plan your meals effortlessly.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Link to="/recipes">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Browse Recipes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-card shadow-sm border">
              <Search className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
              <p className="text-muted-foreground">
                Find recipes by ingredients, cuisine, dietary preferences, and more.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card shadow-sm border">
              <Heart className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Save Favorites</h3>
              <p className="text-muted-foreground">
                Keep track of your favorite recipes and rate dishes you've tried.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card shadow-sm border">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Meal Planning</h3>
              <p className="text-muted-foreground">
                Plan your weekly meals and generate shopping lists automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Cooking?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of home cooks sharing their favorite recipes
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-12">
              Join Now - It's Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;