import { For } from "solid-js";
import { SortableProvider } from "@thisbeyond/solid-dnd";
import { Card } from "../models/Card";
import { CardComponent } from "../components/card";

// Renders cards in sortable snap layout, skipping cards attached to a parent
export const SnapCards = (props: {
  deckId: string;
  zone: string;
  horizontal?: boolean;
  cards: Card[];
}) => {
  return (
    <SortableProvider ids={props.cards.map((c) => c.id)}>
      <For each={props.cards}>
        {(card) => (
          <CardComponent
            card={card}
            zoneId={props.zone}
            horizontal={props.horizontal}
          />
        )}
      </For>
    </SortableProvider>
  );
};
