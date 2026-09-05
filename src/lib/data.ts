export type Crop = {
  src: string;
  sw: number;
  sh: number;
  x: number;
  y: number;
  w: number;
  h: number;
};
export const media = {
  home: { src: "home.webp", sw: 903, sh: 2048, x: 37, y: 389, w: 829, h: 688 },
  lee: { src: "home.webp", sw: 903, sh: 2048, x: 87, y: 421, w: 91, h: 92 },
  alex: {
    src: "profile.webp",
    sw: 720,
    sh: 1680,
    x: 29,
    y: 208,
    w: 176,
    h: 176,
  },
  ocean: {
    src: "profile.webp",
    sw: 720,
    sh: 1680,
    x: 212,
    y: 195,
    w: 508,
    h: 205,
  },
  yoga: { src: "yoga.webp", sw: 720, sh: 1680, x: 0, y: 390, w: 720, h: 830 },
  welcome: {
    src: "welcome.webp",
    sw: 720,
    sh: 1680,
    x: 0,
    y: 184,
    w: 720,
    h: 876,
  },
  friends: {
    src: "friends.webp",
    sw: 902,
    sh: 2048,
    x: 37,
    y: 297,
    w: 829,
    h: 723,
  },
  achievement: {
    src: "profile.webp",
    sw: 720,
    sh: 1680,
    x: 29,
    y: 1204,
    w: 144,
    h: 144,
  },
  core: { src: "picks.webp", sw: 720, sh: 1680, x: 44, y: 352, w: 306, h: 306 },
  strength: {
    src: "picks.webp",
    sw: 720,
    sh: 1680,
    x: 371,
    y: 352,
    w: 306,
    h: 306,
  },
  quick: {
    src: "picks.webp",
    sw: 720,
    sh: 1680,
    x: 44,
    y: 822,
    w: 306,
    h: 306,
  },
  hiit: {
    src: "picks.webp",
    sw: 720,
    sh: 1680,
    x: 371,
    y: 822,
    w: 306,
    h: 306,
  },
  upper: {
    src: "workouts.webp",
    sw: 902,
    sh: 2048,
    x: 37,
    y: 1210,
    w: 400,
    h: 400,
  },
  running: {
    src: "running.webp",
    sw: 720,
    sh: 1680,
    x: 0,
    y: 200,
    w: 720,
    h: 442,
  },
} satisfies Record<string, Crop>;

export type Workout = {
  id: string;
  title: string;
  minutes: number;
  category: string;
  intensity: string;
  image: Crop;
  equipment: string;
  description: string;
};
export const workouts: Workout[] = [
  {
    id: "bodyweight-beach",
    title: "BODYWEIGHT BEACH 🚀💥",
    minutes: 33,
    category: "Strength",
    intensity: "Moderate",
    image: media.home,
    equipment: "No Equipment Required",
    description: "quick no weights travel work out",
  },
  {
    id: "morning-yoga",
    title: "Morning Yoga Flow",
    minutes: 18,
    category: "Flexibility",
    intensity: "Low",
    image: media.yoga,
    equipment: "No Equipment Required",
    description: "Morning Yoga Flow",
  },
  {
    id: "core-glutes",
    title: "Core and Glutes Burner",
    minutes: 27,
    category: "Strength",
    intensity: "Moderate",
    image: media.core,
    equipment: "Exercise Mat",
    description: "Core and Glutes Burner",
  },
  {
    id: "full-body",
    title: "Full Body Strength",
    minutes: 24,
    category: "Strength",
    intensity: "Moderate",
    image: media.strength,
    equipment: "Dumbbells",
    description: "Full Body Strength",
  },
  {
    id: "upper-body",
    title: "Upper Body Power Hour",
    minutes: 58,
    category: "Strength",
    intensity: "Moderate",
    image: media.upper,
    equipment: "Dumbbells",
    description: "Upper Body Power Hour",
  },
  {
    id: "quick-core",
    title: "Quick Core Crusher",
    minutes: 19,
    category: "Strength",
    intensity: "Moderate",
    image: media.quick,
    equipment: "Exercise Mat",
    description: "Quick Core Crusher",
  },
  {
    id: "hiit",
    title: "HIIT to the Max",
    minutes: 22,
    category: "Cardio",
    intensity: "Intense",
    image: media.hiit,
    equipment: "No Equipment Required",
    description: "HIIT to the Max",
  },
  {
    id: "running",
    title: "Running",
    minutes: 45,
    category: "Running",
    intensity: "Moderate",
    image: media.running,
    equipment: "No Equipment Required",
    description: "Running",
  },
];
export const activities = [
  "Walking",
  "Biking",
  "Running",
  "Cardio",
  "Barre",
  "Baseball",
  "Basketball",
  "Boxing",
  "Climbing",
  "Cycling",
  "Dance",
  "Elliptical",
  "Golf",
  "Hike",
  "Pilates",
  "Rowing",
  "Soccer",
  "Swimming",
  "Tennis",
  "Yoga",
];
for (const name of activities) {
  const id = name.toLowerCase();
  if (!workouts.some((w) => w.id === id))
    workouts.push({
      id,
      title: name,
      minutes: 30,
      category: "Activity",
      intensity: "Moderate",
      image: media.running,
      equipment: "No Equipment Required",
      description: name,
    });
}
export const coachMessage =
  "For today, I uploaded a full-body, bodyweight workout. It's set up in a **21-15-9** format, so the reps decrease each round. It starts out looking like a lot of work, but the decreasing reps help you keep the intensity up while still getting a great training stimulus.\n\nGive it a go and let me know how it feels. I'm looking forward to hearing what you think!";
