import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChefHat, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MealPlanPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({ title: "Please sign in to view your meal plan" });
        navigate("/auth");
        return;
      }
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session) {
      fetchMealPlans();
    }
  }, [session]);

  const fetchMealPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*, recipes(id, title, image_url)")
        .eq("user_id", session.user.id)
        .gte("meal_date", new Date().toISOString().split("T")[0])
        .order("meal_date")
        .order("meal_type");

      if (error) throw error;
      setMealPlans(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading meal plans",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeMealPlan = async (id: string) => {
    try {
      await supabase.from("meal_plans").delete().eq("id", id);
      toast({ title: "Removed from meal plan" });
      fetchMealPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const groupedMealPlans: Record<string, any[]> = mealPlans.reduce((acc, plan) => {
    const date = plan.meal_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(plan);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Calendar className="w-10 h-10" />
              Meal Plan
            </h1>
            <p className="text-muted-foreground">Plan your weekly meals</p>
          </div>
          <Link to="/recipes">
            <Button>Browse Recipes</Button>
          </Link>
        </div>

        {Object.keys(groupedMealPlans).length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No meals planned yet</h3>
              <p className="text-muted-foreground mb-4">
                Start planning your meals by browsing recipes
              </p>
              <Link to="/recipes">
                <Button>Browse Recipes</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedMealPlans).map(([date, meals]) => (
              <div key={date}>
                <h2 className="text-2xl font-semibold mb-4">
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                <div className="grid gap-4">
                  {meals.map((meal) => (
                    <Card key={meal.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            {meal.recipes?.image_url ? (
                              <img
                                src={meal.recipes.image_url}
                                alt={meal.recipes.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ChefHat className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <Badge className="mb-2">{meal.meal_type}</Badge>
                            <Link
                              to={`/recipes/${meal.recipes?.id}`}
                              className="text-lg font-semibold hover:underline block"
                            >
                              {meal.recipes?.title}
                            </Link>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMealPlan(meal.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanPage;