export class Card {
  id: string;
  name: string;
  image: string;

  constructor(name: string, image: string) {
    this.name = name;
    this.id = `${name}-${crypto.randomUUID()}`;
    this.image = image;
  }
}
