'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Smile, Send } from 'lucide-react';

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
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: reaction }),
      });

      if (!response.ok) throw new Error('Failed to add reaction');
      
      // Refresh comments would require parent callback
      setShowReactions(null);
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

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
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-xs flex-shrink-0">
          {comment.user?.avatar ? (
            <img 
              src={comment.user.avatar} 
              alt={comment.user.fullName} 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            (comment.user?.fullName || 'U').charAt(0).toUpperCase()
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1">
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="font-semibold text-sm text-gray-900">{comment.user?.fullName || 'Unknown'}</p>
            <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <button className="hover:text-primary transition-colors">Like</button>
            <button 
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="hover:text-primary transition-colors flex items-center space-x-1"
            >
              <MessageCircle size={12} />
              <span>Reply</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowReactions(showReactions === comment.id ? null : comment.id)}
                className="hover:text-primary transition-colors"
              >
                <Smile size={12} />
              </button>
              {showReactions === comment.id && (
                <div className="absolute z-10 bottom-6 left-0 bg-white border border-gray-200 rounded-lg p-2 flex gap-2 shadow-lg">
                  {REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleAddReaction(comment.id, emoji)}
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
                          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                            {friend.avatar ? (
                              <img src={friend.avatar} alt={friend.fullName} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              friend.fullName.charAt(0).toUpperCase()
                            )}
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

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowReplies(prev => ({
                  ...prev,
                  [comment.id]: !prev[comment.id]
                }))}
                className="text-xs text-primary hover:underline"
              >
                {showReplies[comment.id] ? 'Hide' : `Show ${comment.replies.length}`} repl{comment.replies.length !== 1 ? 'ies' : 'y'}
              </button>
              {showReplies[comment.id] && (
                <div className="mt-3 space-y-3">
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
