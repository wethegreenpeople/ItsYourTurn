export class Card {
  id: string;
  name: string;

  constructor(name: string) {
    this.name = name;
    this.id = `${name}-${crypto.randomUUID()}`;
  }
}
