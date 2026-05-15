export type ItemType = 'food' | 'water' | 'medicine' | 'material';

export interface ItemEffect {
  hunger?: number;     // positive = restore
  thirst?: number;
  health?: number;
  infection?: number;  // negative = reduce
  fatigue?: number;    // negative = reduce
  morale?: number;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  effects: ItemEffect;
}
