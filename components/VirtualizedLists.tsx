import React, { useCallback, useMemo } from 'react';

// Optional: requires 'npm install react-window'
// Fallback if not installed
let FixedSizeList: any = null;
try {
  const ReactWindow = require('react-window');
  FixedSizeList = ReactWindow.FixedSizeList;
} catch (e) {
  console.warn('react-window not installed. Virtual scrolling will be disabled.');
}

interface VirtualizedListProps {
  items: any[];
  itemSize: number;
  height: number;
  width: string | number;
  renderItem: (index: number, item: any, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

/**
 * Composant pour liste virtualisée haute performance
 * Utilise react-window pour ne rendre que les éléments visibles
 */
export const VirtualizedList = React.memo(function VirtualizedList({
  items,
  itemSize,
  height,
  width,
  renderItem,
  className = '',
  overscanCount = 5,
}: VirtualizedListProps) {
  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height, width }}
      >
        <p className="text-gray-400">No items to display</p>
      </div>
    );
  }

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = items[index];
      return renderItem(index, item, style);
    },
    [items, renderItem]
  );

  return (
    FixedSizeList ? (
      <FixedSizeList
        height={height}
        itemCount={items.length}
        itemSize={itemSize}
        width={width}
        overscanCount={overscanCount}
        className={className}
      >
        {Row}
      </FixedSizeList>
    ) : (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height, width }}
      >
        <p className="text-gray-400">Virtual scrolling not available (install react-window)</p>
      </div>
    )
  );
});

VirtualizedList.displayName = 'VirtualizedList';

/**
 * Hook pour gérer l'état de la virtualisation
 */
export function useVirtualization(
  items: any[],
  itemSize: number = 60,
  containerHeight: number = 400
) {
  const visibleItems = useMemo(() => {
    // Calculer combien d'éléments sont visibles
    return Math.ceil(containerHeight / itemSize) + 2; // +2 pour buffer
  }, [containerHeight, itemSize]);

  return {
    itemSize,
    containerHeight,
    visibleItems,
    totalItems: items.length,
    shouldVirtualize: items.length > visibleItems,
  };
}

/**
 * Wrapper pour MessagesList avec virtualisation
 */
export interface MessageItemData {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  timestamp: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    userIds: string[];
  }>;
  isOptimistic?: boolean;
  status?: 'pending' | 'sent' | 'failed';
}

interface VirtualizedMessagesListProps {
  messages: MessageItemData[];
  renderMessage: (message: MessageItemData, style: React.CSSProperties) => React.ReactNode;
  height?: number;
  itemSize?: number;
  className?: string;
}

export const VirtualizedMessagesList = React.memo(function VirtualizedMessagesList({
  messages,
  renderMessage,
  height = 500,
  itemSize = 80,
  className = '',
}: VirtualizedMessagesListProps) {
  const { shouldVirtualize } = useVirtualization(messages, itemSize, height);

  // Si peu d'items, ne pas virtualiser
  if (!shouldVirtualize) {
    return (
      <div className={`overflow-y-auto ${className}`} style={{ height }}>
        {messages.map((message) => (
          <div key={message.id} style={{ height: itemSize }}>
            {renderMessage(message, {})}
          </div>
        ))}
      </div>
    );
  }

  // Sinon utiliser la virtualisation
  return (
    <VirtualizedList
      items={messages}
      itemSize={itemSize}
      height={height}
      width="100%"
      className={className}
      renderItem={(index, message, style) => (
        <div key={message.id} style={style}>
          {renderMessage(message, style)}
        </div>
      )}
    />
  );
});

VirtualizedMessagesList.displayName = 'VirtualizedMessagesList';

/**
 * Wrapper pour ConversationsList avec virtualisation
 */
export interface ConversationItemData {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  members: Array<{
    id: string;
    username: string;
    avatar: string;
  }>;
}

interface VirtualizedConversationsListProps {
  conversations: ConversationItemData[];
  renderConversation: (conversation: ConversationItemData, style: React.CSSProperties) => React.ReactNode;
  height?: number;
  itemSize?: number;
  className?: string;
}

export const VirtualizedConversationsList = React.memo(
  function VirtualizedConversationsList({
    conversations,
    renderConversation,
    height = 600,
    itemSize = 70,
    className = '',
  }: VirtualizedConversationsListProps) {
    const { shouldVirtualize } = useVirtualization(conversations, itemSize, height);

    // Si peu d'items, ne pas virtualiser
    if (!shouldVirtualize) {
      return (
        <div className={`overflow-y-auto ${className}`} style={{ height }}>
          {conversations.map((conversation) => (
            <div key={conversation.id} style={{ height: itemSize }}>
              {renderConversation(conversation, {})}
            </div>
          ))}
        </div>
      );
    }

    // Sinon utiliser la virtualisation
    return (
      <VirtualizedList
        items={conversations}
        itemSize={itemSize}
        height={height}
        width="100%"
        className={className}
        renderItem={(index, conversation, style) => (
          <div key={conversation.id} style={style}>
            {renderConversation(conversation, style)}
          </div>
        )}
      />
    );
  }
);

VirtualizedConversationsList.displayName = 'VirtualizedConversationsList';

/**
 * Hook custom pour gérer les états de la virtualisation
 */
export function useVirtualizedScroll(
  items: any[],
  onLoadMore?: (startIndex: number, endIndex: number) => void
) {
  const handleScroll = useCallback(
    ({ scrollUpdateWasRequested, scrollOffset, scrollUpdateReason }: any) => {
      if (onLoadMore && scrollUpdateReason === 'observed') {
        // Trigger load more quand l'utilisateur scrolle près de la fin
        onLoadMore(scrollOffset, scrollOffset + 100);
      }
    },
    [onLoadMore]
  );

  return { handleScroll };
}
