function uuid4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export class Card {
  id: string;
  name: string;
  image: string;

  constructor(name: string, image: string) {
    this.name = name;
    this.id = `${name}-${crypto.randomUUID?.() ?? uuid4()}`;
    this.image = image;
  }
}
