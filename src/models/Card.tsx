import { uuid4 } from "../utils/uuid";

export class Card {
  id: string;
  name: string;
  image: string;

  constructor(name: string, image: string) {
    this.name = name;
    this.id = `${name}-${uuid4()}`;
    this.image = image;
  }
}
