import { uuid4 } from "../utils/uuid";

export interface Card {
  id: string;
  name: string;
  image: string;
}

export function createCard(name: string, image: string): Card {
  return { id: `${name}-${uuid4()}`, name, image };
}
