import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Clock, ChefHat, Users, Heart, Star, Calendar, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RecipeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [mealDate, setMealDate] = useState("");
  const [mealType, setMealType] = useState("Dinner");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (id) {
      fetchRecipeDetails();
    }
  }, [id, session]);

  const fetchRecipeDetails = async () => {
    try {
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("*, profiles(full_name, avatar_url)")
        .eq("id", id)
        .single();

      if (recipeError) throw recipeError;
      setRecipe(recipeData);

      const { data: ingredientsData } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", id)
        .order("display_order");

      setIngredients(ingredientsData || []);

      const { data: reviewsData } = await supabase
        .from("recipe_reviews")
        .select("*, profiles(full_name)")
        .eq("recipe_id", id)
        .order("created_at", { ascending: false });

      setReviews(reviewsData || []);

      if (session) {
        const { data: favoriteData } = await supabase
          .from("favorites")
          .select("*")
          .eq("recipe_id", id)
          .eq("user_id", session.user.id)
          .single();

        setIsFavorite(!!favoriteData);
      }
    } catch (error: any) {
      toast({
        title: "Error loading recipe",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async () => {
    if (!session) {
      toast({ title: "Please sign in to save favorites" });
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("recipe_id", id)
          .eq("user_id", session.user.id);
        setIsFavorite(false);
        toast({ title: "Removed from favorites" });
      } else {
        await supabase
          .from("favorites")
          .insert({ recipe_id: id, user_id: session.user.id });
        setIsFavorite(true);
        toast({ title: "Added to favorites" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const submitReview = async () => {
    if (!session) {
      toast({ title: "Please sign in to leave a review" });
      return;
    }

    try {
      await supabase.from("recipe_reviews").insert({
        recipe_id: id,
        user_id: session.user.id,
        rating,
        comment,
      });

      toast({ title: "Review submitted!" });
      setComment("");
      fetchRecipeDetails();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const addToMealPlan = async () => {
    if (!session) {
      toast({ title: "Please sign in to add to meal plan" });
      return;
    }

    if (!mealDate) {
      toast({ title: "Please select a date" });
      return;
    }

    try {
      await supabase.from("meal_plans").insert({
        recipe_id: id,
        user_id: session.user.id,
        meal_date: mealDate,
        meal_type: mealType,
      });

      toast({ title: "Added to meal plan!" });
      setMealDate("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteRecipe = async () => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    try {
      await supabase.from("recipes").delete().eq("id", id);
      toast({ title: "Recipe deleted" });
      navigate("/recipes");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "N/A";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {recipe.image_url ? (
              <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ChefHat className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{recipe.title}</h1>
                <p className="text-muted-foreground">By {recipe.profiles?.full_name}</p>
              </div>
              {session && session.user.id === recipe.user_id && (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <Link to={`/recipes/${id}/edit`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="destructive" size="icon" onClick={deleteRecipe}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge>{recipe.difficulty}</Badge>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="font-semibold">{avgRating}</span>
                <span className="text-muted-foreground">({reviews.length} reviews)</span>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">{recipe.description}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Prep</p>
                  <p className="font-semibold">{recipe.prep_time} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Cook</p>
                  <p className="font-semibold">{recipe.cook_time} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Servings</p>
                  <p className="font-semibold">{recipe.servings}</p>
                </div>
              </div>
            </div>

            <Button onClick={toggleFavorite} variant={isFavorite ? "default" : "outline"} className="w-full mb-4">
              <Heart className={`w-4 h-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
              {isFavorite ? "Saved" : "Save Recipe"}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {ingredients.map((ing) => (
                    <li key={ing.id} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full" />
                      <span>
                        {ing.quantity} {ing.unit} {ing.ingredient}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{recipe.instructions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">Leave a Review</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 cursor-pointer ${
                            star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                          }`}
                          onClick={() => setRating(star)}
                        />
                      ))}
                    </div>
                    <Textarea
                      placeholder="Share your experience..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="mb-2"
                    />
                    <Button onClick={submitReview}>Submit Review</Button>
                  </div>
                )}

                {reviews.map((review) => (
                  <div key={review.id} className="border-b last:border-0 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{review.profiles?.full_name}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Add to Meal Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Meal Type</label>
                  <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Breakfast">Breakfast</SelectItem>
                      <SelectItem value="Lunch">Lunch</SelectItem>
                      <SelectItem value="Dinner">Dinner</SelectItem>
                      <SelectItem value="Snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addToMealPlan} className="w-full">
                  Add to Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailPage;