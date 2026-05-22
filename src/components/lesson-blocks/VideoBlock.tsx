import type { VideoSection } from "@/lib/section-types";
import VideoPlayer from "@/components/VideoPlayer";

export default function VideoBlock({ vimeoId }: VideoSection) {
  return (
    <div className="my-4 rounded-xl overflow-hidden shadow-sm">
      <VideoPlayer vimeoId={vimeoId} />
    </div>
  );
}
