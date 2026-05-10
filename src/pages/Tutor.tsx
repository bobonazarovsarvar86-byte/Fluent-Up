import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowLeft, Send, MessageCircle, Plus, Trash2, Lock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";

type Msg = { role: "user" | "assistant"; content: string };
type Conv = { id: string; title: string; updated_at: string };

const Tutor = () => {
  const { user } = useAuth();
  const { plan, loading: planLoading } = usePlan();
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState("intermediate");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: convs }, { data: prof }] = await Promise.all([
        supabase
          .from("chat_conversations")
          .select("id, title, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false }),
        supabase.from("profiles").select("english_level").eq("id", user.id).maybeSingle(),
      ]);
      setConversations((convs as Conv[]) ?? []);
      if (prof?.english_level) setLevel(prof.english_level);
    })();
  }, [user]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", activeId)
      .order("created_at")
      .then(({ data }) => {
        setMessages((data as Msg[]) ?? []);
      });
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
  };

  const deleteChat = async (id: string) => {
    await supabase.from("chat_conversations").delete().eq("id", id);
    setConversations((c) => c.filter((x) => x.id !== id));
    if (activeId === id) newChat();
  };

  const send = async () => {
    if (!input.trim() || !user || loading) return;
    const text = input.trim();
    setInput("");
    setLoading(true);

    let convId = activeId;
    // Create conversation if first message
    if (!convId) {
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, title: text.slice(0, 60) })
        .select("id, title, updated_at")
        .single();
      if (error || !data) {
        toast.error("Suhbat yaratilmadi");
        setLoading(false);
        return;
      }
      convId = data.id;
      setActiveId(convId);
      setConversations((c) => [data as Conv, ...c]);
    }

    const userMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);

    // Save user message
    await supabase.from("chat_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: text,
    });

    // Stream AI response
    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          level,
        }),
      });

      if (resp.status === 429) {
        toast.error("Juda ko'p so'rov. Biroz kuting.");
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI kreditlari tugadi. Workspace > Usage.");
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        toast.error("AI javob bermadi");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save assistant message
      if (assistantSoFar) {
        await supabase.from("chat_messages").insert({
          conversation_id: convId,
          user_id: user.id,
          role: "assistant",
          content: assistantSoFar,
        });
        await supabase
          .from("chat_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId);
      }
    } catch (e) {
      console.error(e);
      toast.error("Xato yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const isPaid = plan === "pro" || plan === "premium";

  if (!planLoading && !isPaid) {
    return (
      <main className="min-h-screen bg-muted/30 grid place-items-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-card border-2 border-primary/30 p-8 text-center shadow-elegant">
          <div className="w-16 h-16 rounded-2xl gradient-primary grid place-items-center shadow-glow mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">AI Tutor — Pro xususiyati</h1>
          <p className="text-muted-foreground mb-6">
            Shaxsiy AI ustoz bilan cheksiz suhbat Pro va Premium rejalarida ochiladi.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/dashboard" className="flex-1">
              <Button variant="ghost" className="w-full">Orqaga</Button>
            </Link>
            <Link to="/pricing" className="flex-1">
              <Button variant="hero" className="w-full">
                <Crown className="w-4 h-4" />
                Pro'ga o'tish
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 flex flex-col">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </span>
            FluentUp
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container flex-1 grid lg:grid-cols-[280px,1fr] gap-4 py-4 min-h-0">
        {/* Sidebar */}
        <aside className="rounded-3xl bg-card border border-border p-4 flex flex-col min-h-0 max-h-[calc(100vh-7rem)]">
          <Button onClick={newChat} className="w-full mb-3" variant="hero">
            <Plus className="w-4 h-4" /> Yangi suhbat
          </Button>
          <div className="flex-1 overflow-y-auto space-y-1">
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Suhbat tarixi shu yerda paydo bo'ladi
              </p>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center gap-2 rounded-xl p-2 text-sm cursor-pointer hover:bg-muted",
                  activeId === c.id && "bg-muted font-semibold",
                )}
                onClick={() => setActiveId(c.id)}
              >
                <MessageCircle className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{c.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  aria-label="O'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat */}
        <section className="rounded-3xl bg-card border border-border flex flex-col min-h-0 max-h-[calc(100vh-7rem)]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="h-full grid place-items-center text-center px-6">
                <div>
                  <div className="w-16 h-16 rounded-3xl gradient-primary grid place-items-center mx-auto mb-4 shadow-glow">
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-2">AI Tutor</h2>
                  <p className="text-muted-foreground max-w-md">
                    Ingliz tilida xohlagan savolingizni yozing. Men sizga grammatika, so'z va talaffuzni o'rgataman.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2 mt-6 max-w-md mx-auto">
                    {[
                      "Explain present perfect simply",
                      "What's difference between 'in' and 'on'?",
                      "Give me 5 daily English phrases",
                      "Correct: I have went to school",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="text-left text-sm rounded-2xl border border-border p-3 hover:border-primary/40 hover:bg-muted transition-smooth"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex gap-3", m.role === "user" && "justify-end")}
              >
                {m.role === "assistant" && (
                  <div className="shrink-0 w-8 h-8 rounded-full gradient-primary grid place-items-center shadow-glow">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-3xl px-4 py-3 max-w-[80%] text-sm",
                    m.role === "user"
                      ? "gradient-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-strong:text-primary">
                      <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full gradient-primary grid place-items-center animate-pulse">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="rounded-3xl px-4 py-3 bg-muted text-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:100ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:200ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="border-t border-border p-4 flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Savolingizni yozing..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()} variant="hero" size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default Tutor;
