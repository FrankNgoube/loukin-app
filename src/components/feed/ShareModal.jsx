import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function ShareModal({ isOpen, onClose, post }) {
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => base44.entities.User.list(),
    enabled: isOpen,
  });

  const { data: creators = [] } = useQuery({
    queryKey: ["creators-share"],
    queryFn: () => base44.entities.CreatorProfile.filter({}),
    enabled: isOpen,
  });

  const filteredUsers = allUsers.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10);

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Sélectionnez au moins un utilisateur");
      return;
    }

    try {
      const me = await base44.auth.me();
      const promises = selectedUsers.map(userEmail =>
        base44.entities.Message.create({
          sender_email: me.email,
          recipient_email: userEmail,
          content: `📤 Publication partagée: ${window.location.origin}/#/CreatorProfile?id=${post.creator_email}`,
          is_paid: false,
        })
      );
      await Promise.all(promises);
      toast.success(`Partagé avec ${selectedUsers.length} personne(s)`);
      onClose();
    } catch (e) {
      toast.error("Erreur lors du partage");
    }
  };

  const toggleUser = (email) => {
    setSelectedUsers(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Partager la publication</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredUsers.map(user => {
              const creator = creators.find(c => c.user_email === user.email);
              const isSelected = selectedUsers.includes(user.email);
              return (
                <div
                  key={user.id}
                  onClick={() => toggleUser(user.email)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected ? "bg-violet-50 border-2 border-violet-500" : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={creator?.profile_picture_url} />
                    <AvatarFallback className="bg-violet-100 text-violet-700">
                      {user.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {isSelected && <div className="h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs">✓</div>}
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun utilisateur trouvé</p>
            )}
          </div>

          <Button
            onClick={handleShare}
            disabled={selectedUsers.length === 0}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Partager avec {selectedUsers.length} personne(s)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}