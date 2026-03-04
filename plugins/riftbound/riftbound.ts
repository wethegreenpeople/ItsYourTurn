import { Description, PlayArea } from "../base/description";
export class Riftbound implements Description {
  playAreas: PlayArea[] = [
    {
      id: "battlefield",
      region: {
        xStart: 0,
        xFinish: 2,
        yStart: 0,
        yFinish: 2
      }
    }
  ]
}
