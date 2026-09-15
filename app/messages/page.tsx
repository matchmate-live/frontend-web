import { Suspense } from "react";
import MessagesView from "./MessagesView";

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesView />
    </Suspense>
  );
}
