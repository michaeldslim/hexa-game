export type Language = 'ko' | 'en';

export interface IStrings {
  app: { title: string };
  intro: {
    play: string;
    continueGame: string;
    playNew: string;
    settings: string;
    avatarHint: string;
    footerHint: string;
  };
  hud: {
    score: string;
    level: string;
    goal: string;
    best: string;
    combo: string;
    pause: string;
    modeEndless: string;
    modeLevel: string;
    /** Endless: drop-speed tier from score (1–5). */
    difficulty: string;
    records: string;
  };
  controls: {
    left: string;
    right: string;
    down: string;
    rotate: string;
  };
  gestureHint: string;
  settings: {
    title: string;
    language: string;
    playMode: string;
    modeEndless: string;
    modeLevel: string;
    careerMode: string;
    careerDesc: string;
    careerScreen: string;
    careerSection: string;
    sound: string;
    bgmTrack: string;
    bgmVolume: string;
    sfxVolume: string;
    avatars: string;
    playerAvatar: string;
    playerAvatarDesc: string;
    playerAvatarShow: string;
    playerAvatarHide: string;
    playerAvatarCollapsedHint: string;
  };
  career: {
    ranks: Record<
      'intern' | 'staff' | 'assistant' | 'manager' | 'deputy' | 'director' | 'executive' | 'ceo',
      string
    >;
    promoted: { title: string; subtitle: string };
    ceoReached: { title: string; subtitle: string };
    progressNext: string;
    homeBadge: string;
    maxRank: string;
    minLevel: string;
    screen: {
      title: string;
      currentRank: string;
      highestRank: string;
      disabledTitle: string;
      disabledBody: string;
    };
    ladder: {
      achieved: string;
      current: string;
      locked: string;
      progressToNext: string;
      requirement: string;
      requirementLevel: string;
      startingRank: string;
    };
    noProgressDifficulty: string;
  };
  gameOver: {
    titleLose: string;
    titleWin: string;
    loseBody: string;
    winBody: string;
    tapRestart: string;
  };
  stageClear: string;
  comboPopup: string;
  highScore: {
    title: string;
    scoreLine: string;
    initialsHint: string;
    initialsPlaceholder: string;
    save: string;
  };
  scoreRecords: {
    title: string;
    empty: string;
    close: string;
    rank: string;
  };
  common: { back: string };
}
