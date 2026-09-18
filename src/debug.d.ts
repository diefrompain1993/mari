interface Window {
  __VN_DEBUG__?: {
    goToScene(id: string): Promise<void>;
    restartScene(): Promise<void>;
    completeMinigame(): void;
    setCharacterStage(hero: number, girl: number): Promise<void>;
    dumpState(): Record<string, unknown>;
  };
}
