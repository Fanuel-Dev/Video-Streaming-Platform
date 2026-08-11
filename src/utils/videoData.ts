import { Video } from '../types';

export const VIDEO_LIBRARY: Video[] = [
  {
    id: 'cyberpunk-neon',
    title: 'Neon Odyssey 2099',
    description: 'A spectacular journey through the rain-slicked, neon-drenched streets of Neo-Tokyo as a rogue cyber-detective uncovers a massive corporate conspiracy.',
    category: 'Sci-Fi',
    posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop',
    videoUrls: {
      '1080p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      '720p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      '360p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
    duration: 596, // 10 mins
    views: 124500,
    rating: 4.8,
    releaseYear: 2025,
    creator: 'Lucid Dreams Studio',
  },
  {
    id: 'nature-documentary',
    title: 'The Silent Canopy',
    description: 'Explore the mystical deep rainforests of the Pacific Northwest, captured in ultra-high fidelity. Witness rare animal encounters and ancient old-growth ecosystems.',
    category: 'Documentary',
    posterUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop',
    videoUrls: {
      '1080p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      '720p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      '360p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    },
    duration: 734, // 12 mins
    views: 89430,
    rating: 4.9,
    releaseYear: 2026,
    creator: 'Earthbound Productions',
  },
  {
    id: 'action-thrill',
    title: 'Velocity Vector',
    description: 'High-octane racing sequences and extreme sports across absolute vertical desert canyons. A high-energy experience crafted for speed enthusiasts.',
    category: 'Action',
    posterUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=600&auto=format&fit=crop',
    videoUrls: {
      '1080p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      '720p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      '360p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    },
    duration: 120, // 2 mins
    views: 312000,
    rating: 4.6,
    releaseYear: 2025,
    creator: 'Chrono Kinetics',
  },
  {
    id: 'cosmic-drama',
    title: 'Lightyears Apart',
    description: 'An intimate family drama of astronauts living aboard a deep-space research station orbiting Jupiter, coping with long-distance isolation and existential wonders.',
    category: 'Drama',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
    videoUrls: {
      '1080p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      '720p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      '360p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    },
    duration: 652, // 10 mins
    views: 54100,
    rating: 4.7,
    releaseYear: 2024,
    creator: 'Starlight Cine',
  },
  {
    id: 'deep-ocean-thriller',
    title: 'Abyssal Abyss',
    description: 'A deep-sea submersible crew loses communication in the Mariana Trench, discovering a subterranean biosphere that is as dangerous as it is brilliant.',
    category: 'Thriller',
    posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
    videoUrls: {
      '1080p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      '720p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      '360p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
    duration: 820,
    views: 198200,
    rating: 4.5,
    releaseYear: 2025,
    creator: 'Deep Blue Media',
  }
];
