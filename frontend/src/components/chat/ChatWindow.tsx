import { Search, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Conversation } from '../../types/chat';
import type { Message } from '../../types/message';
import { useSendMessage } from '../../hooks/useSendMessage';
import { useMessages } from '../../hooks/useMessages';
import { useTyping } from '../../hooks/useTyping';
import { useChatStore } from '../../store/chat.store';

interface ChatWindowProps {
  activeConversation: Conversation | null;
}

const MOCK_MESSAGES: Message[] = [
  {
    _id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'u-1',
    content: 'Hey! 👋',
    type: 'text',
    isPinned: false,
    isEdited: false,
    isDeletedForEveryone: false,
    deletedByUsers: [],
    mentions: [],
    starredBy: [],
    reactions: {},
    createdAt: '2026-07-29T10:28:00.000Z',
    updatedAt: '2026-07-29T10:28:00.000Z',
  },
  {
    _id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'u-1',
    content: 'How are you doing?',
    type: 'text',
    isPinned: false,
    isEdited: false,
    isDeletedForEveryone: false,
    deletedByUsers: [],
    mentions: [],
    starredBy: [],
    reactions: {},
    createdAt: '2026-07-29T10:28:30.000Z',
    updatedAt: '2026-07-29T10:28:30.000Z',
  },
  {
    _id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'u-me',
    content: "Hi Priya! I'm good, thanks for asking 😊",
    type: 'text',
    isPinned: false,
    isEdited: false,
    isDeletedForEveryone: false,
    deletedByUsers: [],
    mentions: [],
    starredBy: [],
    reactions: {},
    createdAt: '2026-07-29T10:29:00.000Z',
    updatedAt: '2026-07-29T10:29:00.000Z',
  },
  {
    _id: 'msg-4',
    conversationId: 'conv-1',
    senderId: 'u-me',
    content: 'How about you?',
    type: 'text',
    isPinned: false,
    isEdited: false,
    isDeletedForEveryone: false,
    deletedByUsers: [],
    mentions: [],
    starredBy: [],
    reactions: {},
    createdAt: '2026-07-29T10:29:30.000Z',
    updatedAt: '2026-07-29T10:29:30.000Z',
  },
  {
    _id: 'msg-5',
    conversationId: 'conv-1',
    senderId: 'u-1',
    content: "I'm good too! Just a bit busy with college.",
    type: 'text',
    isPinned: false,
    isEdited: false,
    isDeletedForEveryone: false,
    deletedByUsers: [],
    mentions: [],
    starredBy: [],
    reactions: {},
    createdAt: '2026-07-29T10:30:00.000Z',
    updatedAt: '2026-07-29T10:30:00.000Z',
  },
  {
    _id: 'msg-6',
    conversationId: 'conv-1',
    senderId: 'u-1',
    content: 'We should catch up sometime this week.',
    type: 'text',
    isPinned: false,
    isEdited: false,
    isDeletedForEveryone: false,
    deletedByUsers: [],
    mentions: [],
    starredBy: [],
    reactions: {},
    createdAt: '2026-07-29T10:30:20.000Z',
    updatedAt: '2026-07-29T10:30:20.000Z',
  },
  {
    _id: 'msg-7',
    conversationId: 'conv-1',
    senderId: 'u-me',
    content: "Sure! Let's plan for Friday evening.",
    type: 'text',
    isPinned: false,
    isEdited: false,
    isDeletedForEveryone: false,
    deletedByUsers: [],
    mentions: [],
    starredBy: [],
    reactions: { '👍': ['u-1'] },
    createdAt: '2026-07-29T10:30:40.000Z',
    updatedAt: '2026-07-29T10:30:40.000Z',
  },
];

export function ChatWindow({ activeConversation }: ChatWindowProps) {
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const conversationId = activeConversation?._id || 'conv-1';
  const { data: messagesData } = useMessages(activeConversation ? conversationId : null);
  const sendMessageMutation = useSendMessage(conversationId);
  const { startTyping, stopTyping, isOtherUserTyping } = useTyping(conversationId);

  const realMessages = messagesData?.pages.flatMap((page) => page.items) || [];
  const displayMessages = realMessages.length > 0 ? realMessages : MOCK_MESSAGES;

  const headerTitle = activeConversation?.name || 'Priya Verma';
  const headerAvatar = activeConversation?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';

  const handleSendMessage = (content: string, fileId?: string) => {
    sendMessageMutation.mutate({ content, fileId });
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-50/50 dark:bg-[#0B0F19] transition-colors">
      {/* Header */}
      <div className="h-16 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md flex items-center justify-between shadow-2xs select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveConversation(null)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            <img
              src={headerAvatar}
              alt={headerTitle}
              className="w-10 h-10 rounded-full object-cover border-2 border-violet-500/30"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {headerTitle}
            </h3>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" /> Online
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <button className="p-2 sm:p-2.5 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 sm:p-2.5 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 sm:p-2.5 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 sm:p-2.5 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={displayMessages} isTyping={isOtherUserTyping} />

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={startTyping}
        onTypingStop={stopTyping}
        conversationId={conversationId}
      />
    </div>
  );
}
