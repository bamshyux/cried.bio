export type GuestbookEntry = {
  id: string;
  profile_id: string;
  author_id: string;
  message: string;
  is_approved: boolean;
  created_at: string;
  author?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  reactions?: GuestbookReaction[];
};

export type GuestbookReaction = {
  id: string;
  entry_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type GuestbookFormState = { error?: string; success?: string };

export const GUESTBOOK_EMOJIS = ["👍", "❤️", "🔥", "😂", "🎉", "💯"];
