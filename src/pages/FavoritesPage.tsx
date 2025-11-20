import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({ title: "Please sign in to view your favorites" });
        navigate("/auth");
        return;
      }
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session) {
      fetchFavorites();
    }
  }, [session]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*, recipes(*, profiles(full_name))")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading favorites",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeFavorite = async (recipeId: string) => {
    try {
      await supabase
        .from("favorites")
        .delete()
        .eq("recipe_id", recipeId)
        .eq("user_id", session.user.id);

      toast({ title: "Removed from favorites" });
      fetchFavorites();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Heart className="w-10 h-10 fill-current" />
              My Favorites
            </h1>
            <p className="text-muted-foreground">Your saved recipes</p>
          </div>
          <Link to="/recipes">
            <Button>Browse More Recipes</Button>
          </Link>
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-4">
                Start saving your favorite recipes
              </p>
              <Link to="/recipes">
                <Button>Browse Recipes</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              const recipe = fav.recipes;
              return (
                <Card key={fav.id} className="group relative overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    <Link to={`/recipes/${recipe.id}`}>
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </Link>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFavorite(recipe.id)}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
                    <Badge className="absolute top-2 left-2" variant="secondary">
                      {recipe.difficulty}
                    </Badge>
                  </div>
                  <Link to={`/recipes/${recipe.id}`}>
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
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;