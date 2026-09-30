export type FeedbackEvent = Readonly<{ kind: 'fire' | 'impact' | 'damage' | 'destruction'; x: number; y: number; time: number }>;
