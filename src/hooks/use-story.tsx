
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface Comment {
  id: string;
  text: string;
  author: string;
  created_at: string;
}

interface Story {
  id: string;
  title: string;
  content: string[];
}

export const useStory = (storyId: string) => {
  const [story, setStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStory = async () => {
      try {
        // In a real application, this would fetch from a database
        // For now, we'll use placeholder data
        const mockStory: Story = {
          id: storyId,
          title: "Shadowtide Adventures",
          content: [
            "The ancient city of Eldrath lay shrouded in mist as dawn broke over the eastern mountains. Kavan adjusted his pack, the weight of responsibility heavy on his shoulders. The Council had entrusted him with finding the Dark Eye - an artifact of immense power that had been stolen from the city's sacred vault.",
            "The vault's massive doors bore intricate runes that pulsed with a faint blue light. According to the archives, these wards had stood unbroken for centuries until three nights ago when they were mysteriously bypassed without a trace.",
            "Legends spoke of the Dark Eye as an object of terrible power - a crystalline orb that could bend the will of others and peer into the deepest secrets of the mind. In the wrong hands, it could enslave entire kingdoms.",
            "The Guild of Mages had attempted to trace the artifact's magical signature but found only confusion - as if the Eye itself was deliberately obscuring their efforts. This was unprecedented and deeply troubling.",
            "Kavan's journey led him to the Shadowtide Forest, where ancient trees towered above, their branches intertwining to block most of the sunlight. The air felt heavy with magic and watchful presence.",
            "'I will find it,' Kavan whispered to himself, his determination unwavering despite the dangers ahead. 'No matter what it takes.'",
            "As night fell, the forest grew eerily quiet. Not even insects made a sound. Then, in the distance, Kavan spotted an unnatural glow emanating from a clearing - pulsing with the same rhythm as his own heartbeat.",
            "The Dark Eye hovered in the center of the clearing, suspended in mid-air, its surface swirling with shadows and whispers. As Kavan approached, it seemed to turn toward him, although it had no visible front or back.",
            "'Kavan of Eldrath,' it spoke directly into his mind, the voice ancient and multifaceted. 'I have been waiting for you.'",
            "A battle of wills commenced as the Dark Eye attempted to penetrate Kavan's mental defenses. Images of power and glory flooded his consciousness - visions of himself as ruler of Eldrath, then of all the surrounding lands.",
            "Kavan staggered under the assault but held firm, drawing upon his training and the love he felt for his city and its people. 'You have no power over me,' he declared, though sweat beaded on his brow from the effort.",
            "'I offer you knowledge beyond imagining,' the Eye whispered seductively. 'The secrets of creation itself. All I ask is partnership.'",
            "Summoning every ounce of his magical training, Kavan began the intricate containment spell that the Council had taught him. The air crackled with energy as golden light spiraled from his fingertips toward the Dark Eye.",
            "The Eye reacted violently, sending out pulses of shadow that struck like physical blows. Trees around the clearing began to wither and crack as the Eye drew power from the living forest itself.",
            "'You cannot contain what you do not understand,' the Eye's voice resonated, now tinged with something that could almost be fear. 'I have existed before your kind learned to speak!'",
            "With a final surge of effort, Kavan completed the containment spell. Golden light encased the Dark Eye completely, gradually shrinking inward despite the artifact's resistance. With a sound like glass breaking in reverse, the Eye was suddenly enclosed in a crystal prism etched with protective runes.",
            "The journey back to Eldrath was uneventful, though Kavan could feel the Eye's presence in his mind, diminished but still watching. The Council received him as a hero, but as he handed over the contained artifact, Kavan couldn't shake the feeling that this victory was somehow merely a prelude to a greater conflict yet to come..."
          ]
        };

        setStory(mockStory);
        setTotalPages(mockStory.content.length);
        setIsLoading(false);

        // Fetch comments (would be from a database in a real app)
        fetchComments();
      } catch (err: any) {
        console.error("Error fetching story:", err);
        setError(err.message || "Failed to load story");
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load the story. Please try again.",
          variant: "destructive"
        });
      }
    };

    if (storyId) {
      fetchStory();
    }
  }, [storyId, toast]);

  const fetchComments = async () => {
    // In a real app, this would fetch from a database
    // We're using mocked data for now
    const mockComments: Comment[] = [
      {
        id: "1",
        text: "I love how the story builds tension in the forest scene!",
        author: "BookLover22",
        created_at: new Date().toISOString()
      },
      {
        id: "2",
        text: "The description of the Dark Eye is so vivid. I could really picture it!",
        author: "StoryFan",
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    setComments(mockComments);
  };

  const onPageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const onRestart = () => {
    setCurrentPage(1);
  };

  const onOpenComments = () => {
    setIsCommentsOpen(true);
  };

  const onCloseComments = () => {
    setIsCommentsOpen(false);
  };

  const onAddComment = async (text: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      text,
      author: "CurrentUser", // In a real app, this would be the logged-in user
      created_at: new Date().toISOString()
    };

    setComments(prev => [newComment, ...prev]);
    setIsCommentsOpen(false);

    toast({
      title: "Comment added",
      description: "Your comment has been added successfully."
    });
  };

  const canGoBack = currentPage > 1;

  return {
    story,
    currentPage,
    totalPages,
    comments,
    isLoading,
    error,
    canGoBack,
    isCommentsOpen,
    onPageChange,
    onRestart,
    onOpenComments,
    onCloseComments,
    onAddComment
  };
};
