import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Ingredient {
  ingredient: string;
  quantity: string;
  unit: string;
}

const CreateRecipePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [instructions, setInstructions] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { ingredient: "", quantity: "", unit: "" },
  ]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({ title: "Please sign in to create a recipe" });
        navigate("/auth");
        return;
      }
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (id && session) {
      fetchRecipe();
    }
  }, [id, session]);

  const fetchRecipe = async () => {
    try {
      const { data: recipeData, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (recipeData.user_id !== session.user.id) {
        toast({ title: "You can only edit your own recipes", variant: "destructive" });
        navigate("/recipes");
        return;
      }

      setTitle(recipeData.title);
      setDescription(recipeData.description || "");
      setPrepTime(recipeData.prep_time?.toString() || "");
      setCookTime(recipeData.cook_time?.toString() || "");
      setServings(recipeData.servings?.toString() || "");
      setDifficulty(recipeData.difficulty || "Easy");
      setInstructions(recipeData.instructions || "");
      setImageUrl(recipeData.image_url || "");

      const { data: ingredientsData } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", id)
        .order("display_order");

      if (ingredientsData && ingredientsData.length > 0) {
        setIngredients(ingredientsData.map(ing => ({
          ingredient: ing.ingredient,
          quantity: ing.quantity,
          unit: ing.unit || "",
        })));
      }
    } catch (error: any) {
      toast({ title: "Error loading recipe", description: error.message, variant: "destructive" });
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { ingredient: "", quantity: "", unit: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) return;

    try {
      const recipeData = {
        user_id: session.user.id,
        title,
        description,
        prep_time: parseInt(prepTime) || 0,
        cook_time: parseInt(cookTime) || 0,
        servings: parseInt(servings) || 1,
        difficulty,
        instructions,
        image_url: imageUrl,
      };

      let recipeId = id;

      if (id) {
        await supabase.from("recipes").update(recipeData).eq("id", id);
        await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
      } else {
        const { data, error } = await supabase
          .from("recipes")
          .insert(recipeData)
          .select()
          .single();

        if (error) throw error;
        recipeId = data.id;
      }

      const ingredientsData = ingredients
        .filter((ing) => ing.ingredient && ing.quantity)
        .map((ing, index) => ({
          recipe_id: recipeId,
          ingredient: ing.ingredient,
          quantity: ing.quantity,
          unit: ing.unit,
          display_order: index,
        }));

      if (ingredientsData.length > 0) {
        await supabase.from("recipe_ingredients").insert(ingredientsData);
      }

      toast({ title: id ? "Recipe updated!" : "Recipe created!" });
      navigate(`/recipes/${recipeId}`);
    } catch (error: any) {
      toast({
        title: "Error saving recipe",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-8">{id ? "Edit Recipe" : "Create New Recipe"}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Recipe Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Classic Chocolate Chip Cookies"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your recipe"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Image URL</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  type="url"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Prep Time (min)</label>
                  <Input
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Cook Time (min)</label>
                  <Input
                    type="number"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Servings</label>
                  <Input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Ingredients
                <Button type="button" size="sm" onClick={addIngredient}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Quantity"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                    className="w-24"
                  />
                  <Input
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                    className="w-24"
                  />
                  <Input
                    placeholder="Ingredient"
                    value={ing.ingredient}
                    onChange={(e) => updateIngredient(index, "ingredient", e.target.value)}
                    className="flex-1"
                  />
                  {ingredients.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructions *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Step-by-step instructions..."
                rows={10}
                required
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" size="lg" className="flex-1">
              {id ? "Update Recipe" : "Create Recipe"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRecipePage;