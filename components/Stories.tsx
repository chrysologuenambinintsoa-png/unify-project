'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Story from './Story';
import { Send, SmilePlus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface StoriesProps {
  stories: Story[];
  currentUser?: User;
  onCreated?: () => void;
}

interface Story {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  image?: string;
  video?: string;
  text?: string;
  background?: string;
  timestamp: Date;
  viewed?: boolean;
}

interface User {
  id: string;
  name: string;
  avatar: string;
}

export default function Stories({ stories, currentUser, onCreated }: StoriesProps) {
  const router = useRouter();
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createImage, setCreateImage] = useState('');
  const [createVideo, setCreateVideo] = useState('');
  const [creating, setCreating] = useState(false);
  const [createBackground, setCreateBackground] = useState<string>('gradient-1');
  const [previewType, setPreviewType] = useState<'image'|'video'|null>(null);
  const [storyMessage, setStoryMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [sentEmojis, setSentEmojis] = useState<{emoji: string, id: string}[]>([]);
  // pinnedEmojis: reactions that are displayed on the photo (persisted for the viewer)
  const [pinnedEmojis, setPinnedEmojis] = useState<{emoji: string, id: string}[]>([]);
  const [sendingEmojis, setSendingEmojis] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [viewCount, setViewCount] = useState<number>(0);
  const [reactionGroups, setReactionGroups] = useState<Array<{emoji: string; count: number; users: any[]}>>([]);
  const [progress, setProgress] = useState(0); // 0 - 100 for current story
  const [paused, setPaused] = useState(false);
  const progressRef = useRef<number | null>(null);
  const DURATION = 5000; // ms per story

  // Quick-reaction emojis: love, like, triste, etonné, hahaha
  const emojis = ['❤️', '👍', '😢', '😮', '😂'];

  const handleViewStory = (story: any) => {
    const idx = stories.findIndex(s => s.id === story.id);
    setActiveIndex(idx >= 0 ? idx : 0);
    setActiveStory(story);
  };

  const handleCloseStory = () => {
    setActiveStory(null);
    setActiveIndex(null);
    setStoryMessage('');
    setSelectedEmojis([]);
    setShowEmojiPicker(false);
    setSentEmojis([]);
  };

  // Auto-advance progress management
  useEffect(() => {
    if (activeIndex === null) return;
    setProgress(0);

    const start = Date.now();
    const tick = () => {
      const interactionPaused = paused || showEmojiPicker || !!storyMessage.trim() || sendingEmojis || selectedEmojis.length > 0;
      if (interactionPaused) return;
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / DURATION) * 100 + (progressRef.current ?? 0));
      setProgress(pct);
      if (pct >= 100) {
        goNext();
      }
    };

    const interval = setInterval(tick, 100);
    progressRef.current = 0;
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, paused, showEmojiPicker, storyMessage, sendingEmojis, selectedEmojis.length]);

  // keep activeStory in sync with index
  useEffect(() => {
    if (activeIndex === null) return;
    const s = stories[activeIndex];
    if (s) setActiveStory(s);
  }, [activeIndex, stories]);

  const goNext = () => {
    if (activeIndex === null) return;
    if (activeIndex + 1 < stories.length) {
      setActiveIndex(activeIndex + 1);
    } else {
      handleCloseStory();
    }
  };

  const goPrev = () => {
    if (activeIndex === null) return;
    if (activeIndex - 1 >= 0) {
      setActiveIndex(activeIndex - 1);
    } else {
      // if at first, close viewer
      handleCloseStory();
    }
  };

  // Handle taps / pointer interactions for navigation (left/right)
  const handlePointerUp = (e: any) => {
    try {
      const tgt = e.target as HTMLElement;
      if (tgt && typeof tgt.closest === 'function') {
        const interactive = tgt.closest('button, input, textarea, select, label');
        if (interactive) return;
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clientX = (typeof e.clientX === 'number')
        ? e.clientX
        : (e.changedTouches && e.changedTouches[0] && typeof e.changedTouches[0].clientX === 'number' ? e.changedTouches[0].clientX : null);
      if (!clientX) return;
      const x = clientX - rect.left;
      if (x < rect.width / 2) {
        goPrev();
      } else {
        goNext();
      }
    } catch (err) {}
  };

  const handleSendMessage = async () => {
    // Only send text messages from the input — do not send selected emojis here
    if (!storyMessage.trim()) return;

    if (!activeStory?.id) {
      console.error('No active story to send to');
      return;
    }

    setSendingEmojis(true);
    try {
      // Send the text message only
      try {
        const msgResp = await fetch(`/api/stories/${activeStory.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ message: storyMessage.trim(), imageUrl: activeStory.image }),
        });

        if (!msgResp.ok) {
          let errBody: any = null;
          try { errBody = await msgResp.json(); } catch { errBody = await msgResp.text().catch(() => null); }
          console.error('Failed to send story message:', msgResp.status, errBody);
        }
      } catch (err) {
        console.error('Error sending story message:', err);
      }

      // Close picker and clear input (do not auto-send emojis)
      setShowEmojiPicker(false);
      setStoryMessage('');
      setSelectedEmojis([]);
    } catch (error) {
      console.error('Unexpected error sending message:', error);
    } finally {
      setSendingEmojis(false);
    }
  };

  const toggleEmoji = (emoji: string) => {
    if (!activeStory?.id) return;

    const already = selectedEmojis.includes(emoji);

    // Optimistically update UI
    setSelectedEmojis(prev => (already ? prev.filter(e => e !== emoji) : [...prev, emoji]));

    // fermer le picker automatiquement après sélection
    setShowEmojiPicker(false);

    // optimistic update for reaction groups (so counts appear instantly)
    try {
      const me = currentUser ? { id: currentUser.id, username: currentUser.name, fullName: currentUser.name, avatar: currentUser.avatar } : null;
      setReactionGroups(prev => {
        const copy = JSON.parse(JSON.stringify(prev || [])) as Array<any>;
        const idx = copy.findIndex(r => r.emoji === emoji);
        if (already) {
          // remove my reaction locally
          if (idx >= 0) {
            copy[idx].count = Math.max(0, copy[idx].count - 1);
            if (me) copy[idx].users = copy[idx].users.filter((u: any) => u.id !== me.id);
            if (copy[idx].count === 0) copy.splice(idx, 1);
          }
        } else {
          if (idx >= 0) {
            copy[idx].count = (copy[idx].count || 0) + 1;
            if (me) copy[idx].users = [me, ...copy[idx].users.filter((u: any) => u.id !== me.id)];
          } else {
            copy.unshift({ emoji, count: 1, users: me ? [me] : [] });
          }
        }
        return copy;
      });
    } catch (e) {}

    (async () => {
      try {
        if (already) {
          // remove reaction
          const resp = await fetch(`/api/stories/${activeStory.id}/reactions`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
          });
          if (resp.ok) {
            // remove pinned/sent
            setPinnedEmojis(prev => prev.filter(p => p.emoji !== emoji));
            setSentEmojis(prev => prev.filter(p => p.emoji !== emoji));
          } else {
            console.error('Failed to delete reaction', resp.status);
          }
        } else {
          // create reaction immediately
          const payload = { emoji };
          const resp = await fetch(`/api/stories/${activeStory.id}/reactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload),
          });
            if (resp.ok) {
            const entry = { emoji, id: Math.random().toString(36).slice(2) };
            // pinned: show as a small badge on the photo
            setPinnedEmojis(prev => [...prev, entry]);
            // sent animated emoji
            setSentEmojis(prev => [...prev, entry]);
            // cleanup animated emojis after short delay
            setTimeout(() => setSentEmojis(prev => prev.filter(p => p.id !== entry.id)), 2000);

            // refresh reaction groups so counts update
            (async () => {
              try {
                const r = await fetch(`/api/stories/${activeStory.id}/reactions`);
                if (r.ok) {
                  const j = await r.json();
                  setReactionGroups(j.reactions || []);
                }
              } catch (e) {}
            })();
          } else {
            let errBody: any = null;
            try { errBody = await resp.json(); } catch { errBody = await resp.text().catch(() => null); }
            console.error('Failed to create reaction', resp.status, errBody);
          }
        }
      } catch (err) {
        console.error('Error toggling emoji reaction:', err);
      }
    })();
  };

  const openCreate = () => setShowCreateModal(true);
  const closeCreate = () => setShowCreateModal(false);

  const getBackgroundCss = (bg: string): string => {
    switch (bg) {
      case 'gradient-1': return 'linear-gradient(135deg,#E8B923, #0D2E5F)';
      case 'gradient-2': return 'linear-gradient(135deg,#ff7eb3,#65d6ff)';
      case 'gradient-3': return 'linear-gradient(135deg,#7b2ff7,#f107a3)';
      case 'solid-1': return '#0D2E5F';
      default: return 'linear-gradient(135deg,#0D2E5F,#7b2ff7)';
    }
  };

  const handleCreate = async () => {
      if (!createImage && !createVideo) return;
    setCreating(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: createImage || undefined, videoUrl: createVideo || undefined })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || 'Failed to create story');
      }
            // refresh reaction groups after removal
            if (activeStory?.id) {
              (async () => {
                try {
                  const r = await fetch(`/api/stories/${activeStory.id}/reactions`);
                  if (r.ok) {
                    const j = await r.json();
                    setReactionGroups(j.reactions || []);
                  }
                } catch (e) {}
              })();
            }
      // optionally refresh the page or call parent callback
      closeCreate();
      if (typeof onCreated === 'function') {
        try { onCreated(); } catch {}
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('Create story failed', err);
      alert((err as Error).message || 'Error creating story');
    } finally {
      setCreating(false);
    }
  };

  // When opening a story, record view and fetch viewers + reaction groups
  useEffect(() => {
    if (!activeStory?.id) return;
    let mounted = true;

    const fetchStats = async () => {
      try {
        // mark as viewed (server will ignore if already viewed)
        try {
          await fetch(`/api/stories/${activeStory.id}/views`, { method: 'POST', credentials: 'same-origin' });
        } catch (e) {}

        const vResp = await fetch(`/api/stories/${activeStory.id}/views`, { credentials: 'include' });
        if (vResp.ok) {
          const j = await vResp.json();
          if (mounted) {
            setViewCount(j.total || 0);
            setViewers(j.views || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch views', err);
      }

      try {
        const rResp = await fetch(`/api/stories/${activeStory.id}/reactions`, { credentials: 'include' });
        if (rResp.ok) {
          const j = await rResp.json();
          if (mounted) setReactionGroups(j.reactions || []);
        }
      } catch (err) {
        console.error('Failed to fetch reactions', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => { mounted = false; clearInterval(interval); };
  }, [activeStory?.id]);

  // Real-time SSE subscription
  useEffect(() => {
    if (!activeStory?.id) return;
    // Send cookies with SSE when possible
    let es: EventSource;
    try {
      es = new EventSource('/api/realtime', { withCredentials: true } as any);
    } catch (e) {
      es = new EventSource('/api/realtime');
    }

    const onView = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.storyId !== activeStory.id) return;
        // update views
        if (data.view) {
          setViewCount(prev => Math.max(prev, (prev || 0) + 1));
          setViewers(prev => [data.view, ...(prev || [])].slice(0, 50));
        }
      } catch (err) {}
    };

    const onReaction = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.storyId !== activeStory.id) return;
        // handle actions: added / updated / removed
        const { action } = data;
        if (action === 'added' || action === 'updated') {
          const r = data.reaction || data.reaction; // normalized
          setReactionGroups(prev => {
            const copy = JSON.parse(JSON.stringify(prev || []));
            const idx = copy.findIndex((g: any) => g.emoji === r.emoji);
            if (idx >= 0) {
              copy[idx].count = r.count || (copy[idx].count + 1);
              // merge users if provided
              if (r.user) copy[idx].users = [r.user, ...copy[idx].users.filter((u:any)=>u.id!==r.user.id)];
            } else {
              copy.unshift({ emoji: r.emoji, count: r.count || 1, users: r.user ? [r.user] : [] });
            }
            return copy;
          });
        } else if (action === 'removed') {
          const emoji = data.emoji;
          setReactionGroups(prev => {
            const copy = JSON.parse(JSON.stringify(prev || []));
            const idx = copy.findIndex((g: any) => g.emoji === emoji);
            if (idx >= 0) {
              copy[idx].count = Math.max(0, (copy[idx].count || 1) - 1);
              if (copy[idx].count === 0) copy.splice(idx, 1);
            }
            return copy;
          });
          setPinnedEmojis(prev => prev.filter(p => p.emoji !== data.emoji));
        }
      } catch (err) {}
    };

    const onMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.storyId !== activeStory.id) return;
        // insert into notifications or handle message received
        // For now, we won't alter UI, but could show a toast or increment counters
      } catch (err) {}
    };

    es.addEventListener('story-view', onView as EventListener);
    es.addEventListener('story-reaction', onReaction as EventListener);
    es.addEventListener('story-message', onMessage as EventListener);

    return () => {
      es.removeEventListener('story-view', onView as EventListener);
      es.removeEventListener('story-reaction', onReaction as EventListener);
      es.removeEventListener('story-message', onMessage as EventListener);
      es.close();
    };
  }, [activeStory?.id]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      {/* Stories Carousel */}
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Create Story Button */}
        {currentUser && (
          <Story
            story={{
              id: 'create',
              user: currentUser,
              image: currentUser.avatar,
              timestamp: new Date(),
            }}
            isUserStory={true}
            currentUser={currentUser}
            onCreateStory={openCreate}
          />
        )}

        {/* User Stories */}
        {stories.map(story => (
          <Story
            key={story.id}
            story={story}
            onViewStory={handleViewStory}
          />
        ))}
      </div>

      {/* Story Viewer Modal */}
      {activeStory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={handleCloseStory}
        >
          <div
            className="relative w-full max-w-3xl h-full md:h-[80vh] md:rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            onPointerUp={handlePointerUp}
          >
            {/* Multi-segment Progress (Facebook-like) */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4">
              <div className="flex gap-2">
                {stories.map((s, idx) => (
                  <div key={s.id} className="flex-1 h-1 bg-gray-600 rounded overflow-hidden">
                    <div
                      className="h-full bg-white rounded transition-all ease-linear"
                      style={{ width: idx < (activeIndex ?? -1) ? '100%' : idx === activeIndex ? `${progress}%` : '0%' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Story Header */}
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center">
              <div className="w-10 h-10 bg-primary rounded-full border-2 border-white flex items-center justify-center text-white font-bold overflow-hidden">
                <Avatar src={activeStory.user.avatar || null} name={activeStory.user.name} userId={activeStory.user.id} size="sm" className="w-full h-full" />
              </div>
              <div className="ml-3 text-white">
                <p className="font-semibold">{activeStory.user.name}</p>
                <p className="text-sm opacity-80">2h ago</p>
              </div>
              <button
                onClick={handleCloseStory}
                className="ml-auto text-white text-3xl font-bold hover:text-gray-300 hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Story Content: image / video / text with background */}
            <div className="w-full h-full flex items-center justify-center bg-black">
              {activeStory.image ? (
                <img
                  src={activeStory.image}
                  alt={activeStory.user.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : activeStory.video ? (
                <video src={activeStory.video} className="max-w-full max-h-full object-contain" controls />
              ) : activeStory.text ? (
              <div
                className="w-full h-full flex items-center justify-center px-6 text-center"
                style={{
                  background: activeStory.background || 'linear-gradient(135deg,#0D2E5F,#7b2ff7)',
                  color: 'white'
                }}
              >
                <div className="text-2xl font-bold break-words whitespace-pre-wrap">{activeStory.text}</div>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-800" />
            )}
            </div>

            {/* Animated Sent Emojis */}
            {/* Reactions summary (emoji counts) */}
            <div className="absolute top-16 left-6 z-20 pointer-events-none flex items-center gap-2">
              {reactionGroups.map(r => (
                <div key={r.emoji} className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded">
                  <span className="text-xl leading-none">{r.emoji}</span>
                  <span className="text-sm">{r.count}</span>
                </div>
              ))}
            </div>

            {/* Viewers (avatars + count) */}
            <div className="absolute top-16 right-6 z-20 pointer-events-none flex items-center gap-2">
              <div className="flex -space-x-2">
                {viewers.slice(0,5).map(u => (
                  <Avatar key={u.id} src={u.user?.avatar || null} name={u.user?.fullName || u.user?.username} userId={u.user?.id} size="sm" className="w-8 h-8 border-2 border-white" />
                ))}
              </div>
              <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">{viewCount} vus</div>
            </div>

            {/* Pinned Emojis (displayed on photo) - small, limited to 3 to avoid clutter */}
            <div className="absolute top-28 right-6 z-20 pointer-events-none flex flex-col items-end gap-1">
              {pinnedEmojis.slice(0,3).map(p => (
                <div key={p.id} className="text-2xl leading-none opacity-90 transform-gpu translate-y-0">
                  {p.emoji}
                </div>
              ))}
            </div>

            {/* Animated Sent Emojis */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {sentEmojis.map((item) => (
                <div
                  key={item.id}
                  className="absolute text-4xl"
                  style={{
                    left: Math.random() * 100 + '%',
                    bottom: '20%',
                    transform: `translateY(0) scale(1) rotate(${Math.floor(Math.random()*30)-15}deg)`,
                    animation: `emojiPop ${1.2 + Math.random() * 0.8}s cubic-bezier(.2,.8,.2,1) forwards`
                  }}
                >
                  {item.emoji}
                </div>
              ))}
            </div>

            <style>{`
              @keyframes emojiPop {
                0% {
                  opacity: 1;
                  transform: translateY(0) scale(0.9) rotate(0deg);
                }
                20% {
                  transform: translateY(-8px) scale(1.15) rotate(6deg);
                }
                60% {
                  opacity: 1;
                  transform: translateY(-120px) scale(1) rotate(2deg);
                }
                100% {
                  opacity: 0;
                  transform: translateY(-260px) scale(0.6) rotate(-6deg);
                }
              }
            `}</style>

            {/* Story Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/50 to-transparent">
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mb-3 bg-gray-900/80 rounded-lg p-2 flex gap-2 overflow-x-auto">
                  {emojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => toggleEmoji(emoji)}
                      className={`text-xl px-2 py-1 rounded hover:scale-110 transition-transform ${
                        selectedEmojis.includes(emoji) ? 'ring-2 ring-accent rounded' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Emojis Display */}
              {selectedEmojis.length > 0 && (
                <div className="mb-3 flex gap-2 flex-wrap">
                  {selectedEmojis.map(emoji => (
                    <span
                      key={emoji}
                      className="text-2xl cursor-pointer"
                      onClick={() => toggleEmoji(emoji)}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              )}

              {/* Message Input */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={sendingEmojis}
                  className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Ajouter des emojis"
                >
                  <SmilePlus size={20} className="text-white" />
                </button>
                <input
                  type="text"
                  value={storyMessage}
                  onChange={(e) => setStoryMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !sendingEmojis && handleSendMessage()}
                  placeholder="Envoyer un message"
                  disabled={sendingEmojis}
                  className="flex-1 bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:bg-white/30 border-b border-white/30 pb-2 rounded-lg px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!storyMessage.trim() || sendingEmojis}
                  className="flex-shrink-0 p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Envoyer"
                >
                  <Send size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create Story Modal - Enhanced */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Créer une Story</h2>
              <button
                onClick={closeCreate}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setPreviewType('image')}
                className={`pb-2 px-4 font-medium transition ${previewType === 'image' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Image
              </button>
              <button
                onClick={() => setPreviewType('video')}
                className={`pb-2 px-4 font-medium transition ${previewType === 'video' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Vidéo
              </button>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Side */}
              <div className="space-y-4">
                {previewType === 'image' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ajouter une image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setCreateImage(ev.target?.result as string);
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                      className="w-full"
                    />
                    {createImage && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">✓ Image chargée</p>
                    )}
                  </div>
                )}

                {previewType === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ajouter une vidéo
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setCreateVideo(ev.target?.result as string);
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                      className="w-full"
                    />
                    {createVideo && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">✓ Vidéo chargée</p>
                    )}
                  </div>
                )}
              </div>

              {/* Preview Side */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Aperçu</p>
                <div className="w-48 h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  {previewType === 'image' && createImage ? (
                    <img src={createImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : previewType === 'video' && createVideo ? (
                    <video src={createVideo} className="w-full h-full object-cover" />
                  ) : (
                    <p className="text-gray-400 text-sm text-center">Aperçu de votre story</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeCreate}
                className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Annuler
              </button>
              <button
                  onClick={handleCreate}
                  disabled={creating || (!createImage && !createVideo)}
                className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Publication...' : 'Publier Story'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}