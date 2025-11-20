import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({ title: "Please sign in to view your profile" });
        navigate("/auth");
        return;
      }
      setSession(session);
      fetchProfile(session.user.id);
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name);
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
      }
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio,
          avatar_url: avatarUrl,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast({
        title: "Profile updated!",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
          <User className="w-10 h-10" />
          My Profile
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Bio</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Avatar URL</label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  type="url"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/recipes")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
