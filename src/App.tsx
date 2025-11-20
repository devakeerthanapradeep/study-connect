import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import CreateRecipePage from "./pages/CreateRecipePage";
import ProfilePage from "./pages/ProfilePage";
import FavoritesPage from "./pages/FavoritesPage";
import MealPlanPage from "./pages/MealPlanPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/recipes/create" element={<CreateRecipePage />} />
          <Route path="/recipes/:id/edit" element={<CreateRecipePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/meal-plan" element={<MealPlanPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
