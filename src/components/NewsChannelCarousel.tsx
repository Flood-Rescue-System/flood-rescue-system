"use client";

import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface NewsChannel {
  name: string;
  url: string;
  embedId: string;
}

const NEWS_CHANNELS: NewsChannel[] = [
  {
    name: "24 News",
    url: "https://www.youtube.com/watch?v=1wECsnGZcfc",
    embedId: "1wECsnGZcfc"
  },
  {
    name: "Manorama News",
    url: "https://www.youtube.com/watch?v=tgBTspqA5nY",
    embedId: "tgBTspqA5nY"
  },
  {
    name: "Asianet News",
    url: "https://www.youtube.com/watch?v=Ko18SgceYX8",
    embedId: "Ko18SgceYX8"
  },
  {
    name: "Mathrubhumi News",
    url: "https://www.youtube.com/watch?v=YGEgelAiUf0",
    embedId: "YGEgelAiUf0"
  },
  {
    name: "News18 Kerala",
    url: "https://www.youtube.com/watch?v=tLwTjUNOBsw",
    embedId: "tLwTjUNOBsw"
  },
  {
    name: "Janam TV",
    url: "https://www.youtube.com/watch?v=a6NCp9IoB1c",
    embedId: "a6NCp9IoB1c"
  },
  {
    name: "MediaOne",
    url: "https://www.youtube.com/watch?v=-8d8-c0yvyU",
    embedId: "-8d8-c0yvyU"
  },
  {
    name: "Zee Malayalam",
    url: "https://www.youtube.com/watch?v=LAWWtll-UR0",
    embedId: "LAWWtll-UR0"
  },
  {
    name: "Reporter TV",
    url: "https://www.youtube.com/watch?v=HGOiuQUwqEw",
    embedId: "HGOiuQUwqEw"
  }
];

export default function NewsChannelCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const nextChannel = () => {
    setCurrentIndex((prev) => (prev + 1) % NEWS_CHANNELS.length);
  };

  const previousChannel = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? NEWS_CHANNELS.length - 1 : prev - 1
    );
  };

  const currentChannel = NEWS_CHANNELS[currentIndex];

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2">Live News Channels</h2>
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={previousChannel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Previous channel"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-gray-600 flex-grow text-center">
          {currentChannel.name}
        </span>
        <button
          onClick={nextChannel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Next channel"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="relative w-full aspect-video">
        <iframe
          className="w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${currentChannel.embedId}?autoplay=${isPlaying ? 1 : 0}&mute=1`}
          title={`${currentChannel.name} Live`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg cursor-pointer"
            onClick={() => setIsPlaying(true)}
          >
            <div className="bg-red-600 rounded-full p-4">
              <svg 
                className="w-12 h-12 text-white" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
        {NEWS_CHANNELS.map((channel, index) => (
          <button
            key={channel.embedId}
            onClick={() => {
              setCurrentIndex(index);
              setIsPlaying(false);
            }}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
              index === currentIndex
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {channel.name}
          </button>
        ))}
      </div>
    </div>
  );
} 