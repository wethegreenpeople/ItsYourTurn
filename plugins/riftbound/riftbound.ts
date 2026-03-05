import { Description, PlayArea } from "../base/description";
export class RiftBound implements Description {
  playAreas: PlayArea[] = [
    {
      id: "battlefield",
      region: {
        xStart: 1,
        xFinish: 13,
        yStart: 1,
        yFinish: 7
      }
    },
    {
      id: "base",
      region: {
        xStart: 1,
        xFinish: 7,
        yStart: 7,
        yFinish: 13
      }
    },
    {
      id: "hand",
      region: {
        xStart: 7,
        xFinish: 13,
        yStart: 7,
        yFinish: 13
      }
    }
  ]
}
