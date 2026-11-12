/**
 * Room-type presets for the /paint-calculator/<room>/ pages (App_Flow §A.1).
 * Copy follows PRD §11 and §13: short sentences, no hype, "estimate" never "guarantee".
 */

export type RoomSlug = 'bedroom' | 'living-room' | 'kitchen' | 'bathroom';

export interface RoomFaq {
  q: string;
  a: string;
}

export interface RoomTypePreset {
  slug: RoomSlug;
  /** Name used in headings, for example "Bedroom". */
  name: string;
  /** Typical size in metres. */
  lengthM: number;
  widthM: number;
  heightM: number;
  /** One door and one window are a fair start for most rooms of this type. */
  doors: number;
  windows: number;
  intro: string;
  faqs: readonly [RoomFaq, RoomFaq, RoomFaq];
}

export const ROOM_TYPES: readonly RoomTypePreset[] = [
  {
    slug: 'bedroom',
    name: 'Bedroom',
    lengthM: 4,
    widthM: 3.5,
    heightM: 2.4,
    doors: 1,
    windows: 1,
    intro:
      'A typical bedroom is about 4 by 3.5 metres. Change the sizes to match yours and the paint estimate updates at once.',
    faqs: [
      {
        q: 'How much paint do I need for a bedroom?',
        a: 'A 4 by 3.5 metre bedroom with a door and a window needs about 3 litres per coat on the walls. Two coats is the usual plan, so buy enough for both.',
      },
      {
        q: 'Should I paint the ceiling too?',
        a: 'Only if it needs it. Switch on the ceiling option and the list adds a separate line for ceiling paint.',
      },
      {
        q: 'Do wardrobes count as part of the wall?',
        a: 'Built-in wardrobes you will not paint can be added as an opening. That takes their area off the wall total.',
      },
    ],
  },
  {
    slug: 'living-room',
    name: 'Living room',
    lengthM: 5,
    widthM: 4,
    heightM: 2.4,
    doors: 1,
    windows: 2,
    intro:
      'A typical living room is about 5 by 4 metres. Add every door and window so the wall area is close to the real one.',
    faqs: [
      {
        q: 'How much paint do I need for a living room?',
        a: 'A 5 by 4 metre room with a door and two windows needs about 4 litres per coat on the walls. Plan on two coats.',
      },
      {
        q: 'What about a room with a fireplace or alcoves?',
        a: 'Paint the alcoves as normal. If a feature wall will not be painted, add it as an opening to take its area off.',
      },
      {
        q: 'Is it worth buying a bit extra?',
        a: 'Yes. A small spare covers touch-ups later. The list already includes 5% spare, and you can change it.',
      },
    ],
  },
  {
    slug: 'kitchen',
    name: 'Kitchen',
    lengthM: 4,
    widthM: 3,
    heightM: 2.4,
    doors: 1,
    windows: 1,
    intro:
      'A typical kitchen is about 4 by 3 metres, with a lot of wall hidden behind units. Add the units as openings to see a smaller number.',
    faqs: [
      {
        q: 'How much paint do I need for a kitchen?',
        a: 'Before units, a 4 by 3 metre kitchen needs about 3 litres per coat. Fitted units cover a lot of wall, so measure what you will actually paint.',
      },
      {
        q: 'Do I need a special paint for a kitchen?',
        a: 'A wipeable finish is a good idea near the hob and sink. The quantity maths is the same for any paint.',
      },
      {
        q: 'Should I count the tiled splashback?',
        a: 'No. Add the tiled area as an opening so you do not buy paint for it.',
      },
    ],
  },
  {
    slug: 'bathroom',
    name: 'Bathroom',
    lengthM: 2.5,
    widthM: 2,
    heightM: 2.4,
    doors: 1,
    windows: 1,
    intro:
      'A typical bathroom is about 2.5 by 2 metres. Small rooms often come out under one can, so check the pack sizes on the list.',
    faqs: [
      {
        q: 'How much paint do I need for a bathroom?',
        a: 'A 2.5 by 2 metre bathroom needs about 2 litres per coat on the walls. Two coats usually fit in one 5 litre can.',
      },
      {
        q: 'Do I need a primer in a bathroom?',
        a: 'Often yes on bare plaster or a glossy surface. Switch on the primer option and the list adds a primer line.',
      },
      {
        q: 'What about the tiles?',
        a: 'Tiled walls are not painted. Add the tiled area as an opening, or use the tile calculator for the tiles themselves.',
      },
    ],
  },
];

export function getRoomType(slug: string): RoomTypePreset | undefined {
  return ROOM_TYPES.find((room) => room.slug === slug);
}
