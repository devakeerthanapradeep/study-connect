import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Clock, ChefHat, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Recipe {
  id: string;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  difficulty: string;
  image_url: string;
  profiles: { full_name: string };
}

const RecipesPage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [categoryFilter, difficultyFilter]);

  const fetchRecipes = async () => {
    try {
      let query = supabase
        .from("recipes")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });

      if (difficultyFilter !== "all") {
        query = query.eq("difficulty", difficultyFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecipes(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading recipes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Browse Recipes</h1>
            <p className="text-muted-foreground">Discover delicious recipes from our community</p>
          </div>
          {session && (
            <Link to="/recipes/create">
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Recipe
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recipes Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading recipes...</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No recipes found</h3>
            <p className="text-muted-foreground mb-4">Be the first to share a recipe!</p>
            {session && (
              <Link to="/recipes/create">
                <Button>Create Recipe</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Link key={recipe.id} to={`/recipes/${recipe.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {recipe.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2" variant="secondary">
                      {recipe.difficulty}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{recipe.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {recipe.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChefHat className="w-4 h-4" />
                        <span>{recipe.profiles?.full_name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipesPage;