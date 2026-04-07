import { createFileRoute } from "@tanstack/react-router";

import { ChatWorkspaceView } from "@/components/app/chat/ChatWorkspaceView";

export const Route = createFileRoute("/_app/chat/$chatId")({
  component: ChatByIdPage,
});

function ChatByIdPage() {
  const { chatId } = Route.useParams();

  return <ChatWorkspaceView chatId={chatId} />;
}
