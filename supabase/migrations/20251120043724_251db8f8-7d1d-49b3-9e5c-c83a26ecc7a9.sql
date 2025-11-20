-- Drop existing study-related tables
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS study_groups CASCADE;

-- Update profiles table for recipe users
ALTER TABLE profiles 
DROP COLUMN IF EXISTS department,
DROP COLUMN IF EXISTS year,
DROP COLUMN IF EXISTS interests;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio text;

-- Create categories table
CREATE TABLE recipe_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create recipes table
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  prep_time integer, -- in minutes
  cook_time integer, -- in minutes
  servings integer,
  difficulty text CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  instructions text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create recipe ingredients table
CREATE TABLE recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  ingredient text NOT NULL,
  quantity text NOT NULL,
  unit text,
  display_order integer DEFAULT 0
);

-- Create junction table for recipe categories
CREATE TABLE recipe_category_links (
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  category_id uuid REFERENCES recipe_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, category_id)
);

-- Create reviews table
CREATE TABLE recipe_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, user_id)
);

-- Create favorites table
CREATE TABLE favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Create meal plans table
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  meal_date date NOT NULL,
  meal_type text CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_category_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes
CREATE POLICY "Recipes are viewable by everyone"
  ON recipes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create recipes"
  ON recipes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for recipe_ingredients
CREATE POLICY "Ingredients are viewable by everyone"
  ON recipe_ingredients FOR SELECT USING (true);

CREATE POLICY "Recipe owners can manage ingredients"
  ON recipe_ingredients FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()
  ));

-- RLS Policies for categories
CREATE POLICY "Categories are viewable by everyone"
  ON recipe_categories FOR SELECT USING (true);

CREATE POLICY "Category links are viewable by everyone"
  ON recipe_category_links FOR SELECT USING (true);

CREATE POLICY "Recipe owners can manage category links"
  ON recipe_category_links FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_category_links.recipe_id AND recipes.user_id = auth.uid()
  ));

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON recipe_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON recipe_reviews FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON recipe_reviews FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON recipe_reviews FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for favorites
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON favorites FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for meal_plans
CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create meal plans"
  ON meal_plans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE 
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert some default categories
INSERT INTO recipe_categories (name, slug) VALUES
  ('Breakfast', 'breakfast'),
  ('Lunch', 'lunch'),
  ('Dinner', 'dinner'),
  ('Dessert', 'dessert'),
  ('Appetizer', 'appetizer'),
  ('Salad', 'salad'),
  ('Soup', 'soup'),
  ('Vegetarian', 'vegetarian'),
  ('Vegan', 'vegan'),
  ('Gluten-Free', 'gluten-free');