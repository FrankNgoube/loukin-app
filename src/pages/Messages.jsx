import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, ArrowLeft, MessageCircle, Check, CheckCheck, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUsers, setSearchUsers] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allMessages = [] } = useQuery({
    queryKey: ["messages", user?.email],
    queryFn: async () => {
      const sent = await base44.entities.Message.filter({ sender_email: user.email }, "-created_date", 200);
      const received = await base44.entities.Message.filter({ recipient_email: user.email }, "-created_date", 200);
      return [...sent, ...received].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const { data: creators = [] } = useQuery({
    queryKey: ["all-creators-msg"],
    queryFn: () => base44.entities.CreatorProfile.filter({}),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users-msg"],
    queryFn: () => base44.entities.User.list(),
  });

  const creatorsMap = {};
  creators.forEach(c => { creatorsMap[c.user_email] = c; });

  // Group conversations
  const conversations = {};
  allMessages.forEach(msg => {
    const otherEmail = msg.sender_email === user?.email ? msg.recipient_email : msg.sender_email;
    if (!conversations[otherEmail]) {
      conversations[otherEmail] = { email: otherEmail, messages: [], lastMessage: msg, unread: 0 };
    }
    conversations[otherEmail].messages.push(msg);
    conversations[otherEmail].lastMessage = msg;
    if (msg.recipient_email === user?.email && !msg.is_read) {
      conversations[otherEmail].unread++;
    }
  });

  const filteredConvoList = Object.values(conversations)
    .filter(c => {
      const info = getDisplayInfo(c.email);
      return info.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));

  const selectedMessages = selectedConvo ? conversations[selectedConvo]?.messages || [] : [];

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: async () => {
      setNewMessage("");
      queryClient.invalidateQueries(["messages"]);
      // Mark previous unread messages as read
      const unreadMsgs = selectedMessages.filter(m => m.recipient_email === user.email && !m.is_read);
      for (const msg of unreadMsgs) {
        await base44.entities.Message.update(msg.id, { is_read: true });
      }
    },
  });

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConvo) return;
    sendMutation.mutate({
      sender_email: user.email,
      recipient_email: selectedConvo,
      content: newMessage.trim(),
    });
  };

  useEffect(() => {
    // Mark all unread messages as read when opening a conversation
    if (selectedConvo) {
      const unreadMsgs = selectedMessages.filter(m => m.recipient_email === user.email && !m.is_read);
      unreadMsgs.forEach(msg => {
        base44.entities.Message.update(msg.id, { is_read: true });
      });
    }
  }, [selectedConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages.length]);

  const getDisplayInfo = (email) => {
    const profile = creatorsMap[email];
    const userObj = allUsers.find(u => u.email === email);
    return {
      name: profile?.display_name || userObj?.full_name || email.split("@")[0],
      avatar: profile?.profile_picture_url,
      username: profile?.username,
    };
  };

  const handleStartChat = (email) => {
    setSelectedConvo(email);
    setShowNewChat(false);
    setSearchUsers("");
  };

  const filteredUsers = allUsers.filter(u => 
    u.email !== user?.email && 
    u.full_name.toLowerCase().includes(searchUsers.toLowerCase())
  ).slice(0, 5);

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
      {/* Conversations list */}
      <div className={cn(
        "w-full md:w-80 border-r flex flex-col bg-white",
        selectedConvo && "hidden md:flex"
      )}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg"><span className="gradient-text">Messages</span></h2>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setShowNewChat(!showNewChat)}
            >
              {showNewChat ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={showNewChat ? "Rechercher un utilisateur..." : "Rechercher..."}
              className="pl-9 h-9 rounded-xl text-sm"
              value={showNewChat ? searchUsers : searchQuery}
              onChange={e => showNewChat ? setSearchUsers(e.target.value) : setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {showNewChat ? (
            <div className="p-2">
              {filteredUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Aucun utilisateur trouvé</p>
              ) : (
                filteredUsers.map(u => (
                  <button
                    key={u.email}
                    onClick={() => handleStartChat(u.email)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={creatorsMap[u.email]?.profile_picture_url} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white text-xs font-bold">
                        {u.full_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              {filteredConvoList.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Aucune conversation</p>
                </div>
              ) : (
                filteredConvoList.map(convo => {
                  const info = getDisplayInfo(convo.email);
                  return (
                    <div
                      key={convo.email}
                      onClick={() => setSelectedConvo(convo.email)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors",
                        selectedConvo === convo.email && "bg-violet-50"
                      )}
                    >
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarImage src={info.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white text-sm font-bold">
                          {info.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-sm truncate">{info.name}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                              {moment(convo.lastMessage.created_date).fromNow()}
                            </span>
                            {convo.unread > 0 && (
                              <span className="h-5 min-w-[20px] rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                                {convo.unread}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{convo.lastMessage.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className={cn(
        "flex-1 flex flex-col bg-gray-50/50",
        !selectedConvo && "hidden md:flex"
      )}>
        {selectedConvo ? (
          <>
            {/* Chat header */}
            <div className="h-14 border-b bg-white flex items-center gap-3 px-4">
              <button className="md:hidden" onClick={() => setSelectedConvo(null)}>
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar className="h-8 w-8">
                <AvatarImage src={getDisplayInfo(selectedConvo).avatar} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white text-xs">
                  {getDisplayInfo(selectedConvo).name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{getDisplayInfo(selectedConvo).name}</p>
                {getDisplayInfo(selectedConvo).username && (
                  <p className="text-xs text-muted-foreground">@{getDisplayInfo(selectedConvo).username}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-2xl mx-auto">
                {selectedMessages.map((msg, idx) => {
                  const isOwn = msg.sender_email === user.email;
                  const nextMsg = selectedMessages[idx + 1];
                  const shouldShowTime = !nextMsg || new Date(nextMsg.created_date) - new Date(msg.created_date) > 60000;
                  
                  return (
                    <div key={msg.id}>
                      <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                          isOwn
                            ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-br-md"
                            : "bg-white border rounded-bl-md"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                      {shouldShowTime && (
                        <div className={cn("flex gap-1 items-center text-[11px] text-muted-foreground mt-1.5", isOwn ? "justify-end pr-2" : "justify-start pl-2")}>
                          <span>{moment(msg.created_date).format("HH:mm")}</span>
                          {isOwn && (
                            msg.is_read ? (
                              <CheckCheck className="h-3 w-3 text-blue-500" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t bg-white">
              <div className="flex items-center gap-2 max-w-2xl mx-auto">
                <Input
                  placeholder="Écrire un message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  className="rounded-xl"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sendMutation.isPending}
                  className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}