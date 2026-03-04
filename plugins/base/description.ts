export interface Description {
  playAreas: PlayArea[]
}

export interface PlayArea {
  id: string;
  region: Region;
  description?: string;
}

export interface Region {
  xStart: number;
  xFinish: number;
  yStart: number;
  yFinish: number;
}
