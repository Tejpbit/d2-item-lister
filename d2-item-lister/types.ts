export interface State {
  characters: CharactersEntity[];
  shared_stash: Item[];
}
export interface ItemWithSource extends Item {
  itemSource: string;
}

export interface CharactersEntity {
  header: Header;
  attributes: Attributes;
  skills: SkillsEntity[] | null;
  items: Item[];
  corpse_items?: null;
  merc_items?: MercItemsEntity[] | null;
  golem_item?: null;
  is_dead: number;
}
export interface Header {
  identifier: string;
  checksum: string;
  name: string;
  status: Status;
  class: string;
  last_played: number;
  left_skill: string;
  right_skill: string;
  left_swap_skill: string;
  right_swap_skill: string;
  merc_id: string;
  assigned_skills?: string[] | null;
  quests_normal: QuestsNormalOrQuestsNmOrQuestsHell;
  quests_nm: QuestsNormalOrQuestsNmOrQuestsHell;
  quests_hell: QuestsNormalOrQuestsNmOrQuestsHell;
  version: number;
  filesize: number;
  active_arms: number;
  progression: number;
  level: number;
  difficulty: Difficulty;
  map_id: number;
  dead_merc: number;
  merc_name_id: number;
  merc_type: number;
  merc_experience: number;
}
export interface Status {
  expansion: boolean;
  died: boolean;
  hardcore: boolean;
  ladder: boolean;
}
export interface QuestsNormalOrQuestsNmOrQuestsHell {
  act_i: ActI;
  act_ii: ActIi;
  act_iii: ActIii;
  act_iv: ActIv;
  act_v: ActV;
}
export interface ActI {
  den_of_evil: Quest;
  sisters_burial_grounds: Quest;
  tools_of_the_trade: Quest;
  the_search_for_cain: Quest;
  the_forgotten_tower: Quest;
  sisters_to_the_slaughter: Quest;
}
export interface Quest {
  is_completed: boolean;
  is_requirement_completed: boolean;
}
export interface ActIi {
  radaments_lair: Quest;
  the_horadric_staff: Quest;
  tainted_sun: Quest;
  arcane_sanctuary: Quest;
  the_summoner: Quest;
  the_seven_tombs: Quest;
}
export interface ActIii {
  lam_esens_tome: Quest;
  khalims_will: Quest;
  blade_of_the_old_religion: Quest;
  the_golden_bird: Quest;
  the_blackened_temple: Quest;
  the_guardian: Quest;
}
export interface ActIv {
  the_fallen_angel: Quest;
  terrors_end: Quest;
  hellforge: Quest;
}
export interface ActV {
  siege_on_harrogath: Quest;
  rescue_on_mount_arreat: Quest;
  prison_of_ice: PrisonOfIce;
  betrayal_of_harrogath: Quest;
  rite_of_passage: Quest;
  eve_of_destruction: Quest;
}
export interface PrisonOfIce {
  is_completed: boolean;
  consumed_scroll: boolean;
  is_requirement_completed: boolean;
}
export interface Difficulty {
  Normal: number;
  Nightmare: number;
  Hell: number;
}
export interface Attributes {
  strength: number;
  energy: number;
  dexterity: number;
  vitality: number;
  unused_stats: number;
  unused_skill_points: number;
  current_hp: number;
  max_hp: number;
  current_mana: number;
  max_mana: number;
  current_stamina: number;
  max_stamina: number;
  level: number;
  experience: number;
  gold: number;
  stashed_gold: number;
}
export interface SkillsEntity {
  id: number;
  points: number;
  name: string;
}
export interface Item {
  identified: number;
  socketed: number;
  new: number;
  is_ear: number;
  starter_item: number;
  simple_item: number;
  ethereal: number;
  personalized: number;
  given_runeword: number;
  location_id: number;
  position_x: number;
  position_y: number;
  alt_position_id: number;
  type: string;
  type_id: number;
  type_name: string;
  nr_of_items_in_sockets: number;
  id: number;
  level: number;
  quality: number;
  multiple_pictures: number;
  class_specific: number;
  low_quality_id: number;
  timestamp: number;
  ear_attributes: EarAttributes;
  total_nr_of_sockets: number;
  quantity?: number | null;
  runeword_attributes?: AttributesEntity[] | null;
  set_list_count: number;
  set_attributes?: (AttributesEntity[] | null)[] | null;
  magic_attributes?: AttributesEntity[] | null;
  socketed_items?: SocketedItemsEntity[] | null;
  magic_suffix?: number | null;
  magic_suffix_name?: string | null;
  picture_id?: number | null;
  magic_prefix?: number | null;
  magic_prefix_name?: string | null;
  equipped_id?: number | null;
  defense_rating?: number | null;
  max_durability?: number | null;
  current_durability?: number | null;
  rare_name?: string | null;
  rare_name2?: string | null;
  magical_name_ids?: number[] | null;
  runeword_id?: number | null;
  runeword_name?: string | null;
  base_damage?: BaseDamage | null;
  unique_id?: number | null;
  unique_name?: string | null;
  set_id?: number | null;
  set_name?: string | null;
  set_attributes_num_req?: number[] | null;
}
export interface EarAttributes {
  class: number;
  level: number;
  name: string;
}
export interface AttributesEntity {
  id: number;
  name: string;
  values?: number[] | null;
}
export interface SocketedItemsEntity {
  identified: number;
  socketed: number;
  new: number;
  is_ear: number;
  starter_item: number;
  simple_item: number;
  ethereal: number;
  personalized: number;
  given_runeword: number;
  location_id: number;
  position_x: number;
  position_y: number;
  alt_position_id: number;
  type: string;
  type_id: number;
  type_name: string;
  nr_of_items_in_sockets: number;
  id: number;
  level: number;
  quality: number;
  multiple_pictures: number;
  class_specific: number;
  low_quality_id: number;
  timestamp: number;
  ear_attributes: EarAttributes;
  total_nr_of_sockets: number;
  runeword_attributes?: null;
  set_list_count: number;
  set_attributes?: null;
  magic_attributes?: AttributesEntity[] | null;
  socketed_items?: null;
}
export interface BaseDamage {
  min?: number | null;
  max?: number | null;
  twohand_min?: number | null;
  twohand_max?: number | null;
}
export interface MercItemsEntity {
  identified: number;
  socketed: number;
  new: number;
  is_ear: number;
  starter_item: number;
  simple_item: number;
  ethereal: number;
  personalized: number;
  given_runeword: number;
  location_id: number;
  equipped_id: number;
  position_x: number;
  position_y: number;
  alt_position_id: number;
  type: string;
  type_id: number;
  type_name: string;
  nr_of_items_in_sockets: number;
  id: number;
  level: number;
  quality: number;
  multiple_pictures: number;
  class_specific: number;
  low_quality_id: number;
  timestamp: number;
  ear_attributes: EarAttributes;
  defense_rating?: number | null;
  max_durability: number;
  current_durability: number;
  total_nr_of_sockets: number;
  runeword_attributes?: null;
  set_list_count: number;
  set_attributes?: null;
  unique_id?: number | null;
  unique_name?: string | null;
  magic_attributes?: AttributesEntity[] | null;
  socketed_items?: null;
  magic_prefix?: number | null;
  magic_prefix_name?: string | null;
  magic_suffix?: number | null;
  magic_suffix_name?: string | null;
  rare_name?: string | null;
  rare_name2?: string | null;
  magical_name_ids?: number[] | null;
  base_damage?: BaseDamage1 | null;
}
export interface BaseDamage1 {
  twohand_min: number;
  twohand_max: number;
}
export interface SharedStashEntity {
  identified: number;
  socketed: number;
  new: number;
  is_ear: number;
  starter_item: number;
  simple_item: number;
  ethereal: number;
  personalized: number;
  given_runeword: number;
  location_id: number;
  position_x: number;
  position_y: number;
  alt_position_id: number;
  type: string;
  type_id: number;
  type_name: string;
  nr_of_items_in_sockets: number;
  id: number;
  level: number;
  quality: number;
  multiple_pictures: number;
  class_specific: number;
  low_quality_id: number;
  timestamp: number;
  ear_attributes: EarAttributes;
  total_nr_of_sockets: number;
  runeword_attributes?: null;
  set_list_count: number;
  set_attributes?: (AttributesEntity[] | null)[] | null;
  magic_attributes?: AttributesEntity[] | null;
  socketed_items?: null;
  magic_prefix?: number | null;
  magic_prefix_name?: string | null;
  magic_suffix?: number | null;
  magic_suffix_name?: string | null;
  max_durability?: number | null;
  current_durability?: number | null;
  set_id?: number | null;
  set_name?: string | null;
  set_attributes_num_req?: number[] | null;
  base_damage?: BaseDamage2 | null;
  unique_id?: number | null;
  unique_name?: string | null;
  defense_rating?: number | null;
  picture_id?: number | null;
  rare_name?: string | null;
  rare_name2?: string | null;
  magical_name_ids?: number[] | null;
  equipped_id?: number | null;
  set_attributes_ids_req?: number[] | null;
}
export interface BaseDamage2 {
  min?: number | null;
  max?: number | null;
  twohand_min?: number | null;
  twohand_max?: number | null;
}
