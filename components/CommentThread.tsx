'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Smile, Send } from 'lucide-react';
import { optimizeAvatarUrl } from '@/lib/cloudinaryOptimizer';
import { Avatar } from '@/components/ui/Avatar';

interface CommentThreadProps {
  postId: string;
  comments: any[];
  onCommentAdded: (comment: any) => void;
}

interface Friend {
  id: string;
  fullName: string;
  username: string;
  avatar?: string;
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export function CommentThread({ postId, comments, onCommentAdded }: CommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [commentReactionCounts, setCommentReactionCounts] = useState<{ [key: string]: number }>({});
  const [commentUserLiked, setCommentUserLiked] = useState<{ [key: string]: boolean }>({});
  const [commentReactions, setCommentReactions] = useState<{ [key: string]: Array<{ emoji: string; count: number }> }>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [currentInputField, setCurrentInputField] = useState<string | null>(null);
  const mentionInputRef = useRef<HTMLInputElement>(null);

  // Fetch friends for mention suggestions
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch('/api/friends');
        if (response.ok) {
          const data = await response.json();
          setFriends(data || []);
        }
      } catch (err) {
        console.error('Error fetching friends:', err);
      }
    };
    fetchFriends();
  }, []);

  // Handle mention suggestions
  const handleMentionInput = (text: string) => {
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const searchTerm = text.substring(lastAtIndex + 1).toLowerCase();
      if (searchTerm.length > 0) {
        const filtered = friends.filter(f =>
          f.fullName.toLowerCase().includes(searchTerm) ||
          f.username.toLowerCase().includes(searchTerm)
        );
        setFilteredFriends(filtered);
        setShowMentionSuggestions(true);
        setMentionSearch(searchTerm);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const insertMention = (friend: Friend, fieldType: 'reply' | 'comment') => {
    const text = fieldType === 'reply' ? replyText : '';
    const lastAtIndex = text.lastIndexOf('@');
    const beforeMention = text.substring(0, lastAtIndex);
    const newText = `${beforeMention}@${friend.username} `;
    
    if (fieldType === 'reply') {
      setReplyText(newText);
    }
    
    setShowMentionSuggestions(false);
    mentionInputRef.current?.focus();
  };

  const handleAddReaction = async (commentId: string, reaction: string) => {
    try {
      // Use the dedicated like endpoint for thumbs up to match backend schema
      const isThumb = reaction === '👍';
      const url = isThumb
        ? `/api/posts/${postId}/comments/${commentId}/like`
        : `/api/posts/${postId}/comments/${commentId}/reactions`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isThumb ? {} : { emoji: reaction }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to add reaction');

      const data = await response.json();
      const action = data.action || (data.liked ? 'added' : 'removed');

      // Update grouped reactions map
      setCommentReactions(prev => {
        const groups = prev[commentId] ? [...prev[commentId]] : [];
        const idx = groups.findIndex(g => g.emoji === reaction);
        if (action === 'added') {
          if (idx !== -1) {
            groups[idx] = { ...groups[idx], count: groups[idx].count + 1 };
          } else {
            groups.push({ emoji: reaction, count: 1 });
          }
        } else {
          if (idx !== -1) {
            const newCount = groups[idx].count - 1;
            if (newCount <= 0) {
              groups.splice(idx, 1);
            } else {
              groups[idx] = { ...groups[idx], count: newCount };
            }
          }
        }
        return { ...prev, [commentId]: groups };
      });

      // Update raw thumbs count as well for the Like UI
      setCommentReactionCounts(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || 0) + (action === 'added' ? 1 : -1),
      }));

      // Toggle local user-liked flag for thumbs
      if (isThumb) {
        setCommentUserLiked(prev => ({ ...prev, [commentId]: action === 'added' }));
      }

      setShowReactions(null);
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  // Load initial reaction counts for comments
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const entries = await Promise.all(comments.map(async (c) => {
          try {
            const res = await fetch(`/api/posts/${postId}/comments/${c.id}/reactions`, { credentials: 'include' });
            if (!res.ok) return [c.id, []];
            const json = await res.json();
            const groups = Array.isArray(json.reactions) ? json.reactions.map((r: any) => ({ emoji: r.emoji, count: r.count })) : [];
            return [c.id, groups];
          } catch (e) {
            return [c.id, []];
          }
        }));

        const map: { [key: string]: number } = {};
        const groupedMap: { [key: string]: Array<{ emoji: string; count: number }> } = {};
        for (const [id, groups] of entries) {
          groupedMap[id as string] = groups as any;
          const thumbs = (groups as any[]).find((g: any) => g.emoji === '👍');
          map[id as string] = thumbs ? thumbs.count : 0;
        }
        setCommentReactions(groupedMap);
        setCommentReactionCounts(map);
      } catch (e) {
        console.error('Failed to load comment reactions', e);
      }
    };

    if (comments && comments.length > 0) loadCounts();
  }, [comments, postId]);

  const handleReplySubmit = async (parentCommentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: replyText,
          parentId: parentCommentId 
        }),
      });

      if (!response.ok) throw new Error('Failed to add reply');
      
      const newReply = await response.json();
      onCommentAdded(newReply);
      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error adding reply';
      console.error('Reply error:', errorMsg);
      alert(errorMsg);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const renderComment = (comment: any, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8' : ''}`}>
      {/* Comment */}
      <div className="flex space-x-3 pb-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar src={comment.user?.avatar ? (optimizeAvatarUrl(comment.user.avatar, 32) || comment.user.avatar) : null} name={comment.user?.fullName} userId={comment.user?.id} size="sm" className="w-8 h-8" />
        </div>

        {/* Comment Content */}
        <div className="flex-1">
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="font-semibold text-sm text-gray-900">{comment.user?.fullName || 'Unknown'}</p>
            <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
          </div>

      {/* Actions */}
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <button
              type="button"
              onClick={() => handleAddReaction(comment.id, '👍')}
              className={`transition-colors flex items-center gap-2 text-sm font-medium ${commentUserLiked[comment.id] ? 'text-red-500' : 'hover:text-primary text-gray-600'}`}
            >
              <span className="text-base">👍</span>
              <span>{commentReactionCounts[comment.id] || 0}</span>
            </button>
            <button 
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="hover:text-primary transition-colors flex items-center space-x-1 font-medium"
            >
              <MessageCircle size={14} />
              <span>Reply</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowReactions(showReactions === comment.id ? null : comment.id)}
                className="hover:text-primary transition-colors"
              >
                <Smile size={14} />
              </button>
              {showReactions === comment.id && (
                <div className="absolute z-10 bottom-6 left-0 bg-white border border-gray-200 rounded-lg p-2 flex gap-2 shadow-lg">
                  {REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddReaction(comment.id, emoji);
                      }}
                      className="text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <form onSubmit={(e) => handleReplySubmit(comment.id, e)} className="mt-3 relative">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    ref={mentionInputRef}
                    type="text"
                    value={replyText}
                    onChange={(e) => {
                      setReplyText(e.target.value);
                      handleMentionInput(e.target.value);
                      setCurrentInputField(comment.id);
                    }}
                    onFocus={() => {
                      setCurrentInputField(comment.id);
                      if (replyText.includes('@')) {
                        handleMentionInput(replyText);
                      }
                    }}
                    placeholder={`Reply to ${comment.user?.fullName}...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {/* Mention Suggestions */}
                  {showMentionSuggestions && currentInputField === comment.id && filteredFriends.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto w-full">
                      {filteredFriends.map(friend => (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() => insertMention(friend, 'reply')}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors flex items-center space-x-2 text-sm"
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden">
                            <Avatar src={friend.avatar ? (optimizeAvatarUrl(friend.avatar, 24) || friend.avatar) : null} name={friend.fullName} userId={friend.id} size="sm" className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-medium">{friend.fullName}</p>
                            <p className="text-xs text-gray-500">@{friend.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSubmittingReply}
                  className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          )}

          {/* Reactions display */}
          {commentReactions[comment.id] && commentReactions[comment.id].length > 0 && (
            <div className="mt-2 flex items-center space-x-2 text-sm">
              {commentReactions[comment.id].map(r => (
                <div key={r.emoji} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
                  <span className="text-base">{r.emoji}</span>
                  <span className="text-xs text-gray-600">{r.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowReplies(prev => ({
                  ...prev,
                  [comment.id]: !prev[comment.id]
                }))}
                className="text-xs text-primary hover:text-primary-dark font-semibold transition-colors"
              >
                {showReplies[comment.id] ? '▼ Masquer les réponses' : `▶ Afficher ${comment.replies.length} réponse${comment.replies.length > 1 ? 's' : ''}`}
              </button>
              {showReplies[comment.id] && (
                <div className="mt-3 space-y-3 border-l-2 border-gray-200 pl-3 ml-2">
                  {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-4">No comments yet. Be the first to comment!</p>
      ) : (
        comments.map(comment => renderComment(comment))
      )}
    </div>
  );
}
