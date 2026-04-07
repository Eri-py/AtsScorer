import { createFileRoute } from "@tanstack/react-router";
import { ChatWorkspaceView } from "@/components/app/chat/ChatWorkspaceView";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  return <ChatWorkspaceView chatId={null} />;
}
