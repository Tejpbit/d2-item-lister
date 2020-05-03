import React, { useEffect, useReducer, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import styled from "styled-components/native";
import { Item, ItemWithSource, State } from "./types";
import { FilterSelect } from "./src/components/FilterSelector";
import { ModeText } from "./src/components/ModeText";
import { Link } from "./src/components/Link";
import _ from "lodash";
import { useStoredReducer } from "./src/customHooks/useStoredReducer";

const fixyfix = (state: State | null): ItemWithSource[] => {
  if (state === null) {
    return [];
  }

  const characterItems: ItemWithSource[] = state.characters?.flatMap((c) =>
    c.items.map((i) => ({ ...i, itemSource: c.header.name }))
  );
  const sharedStashItems: ItemWithSource[] = state.shared_stash.map((i) => ({
    ...i,
    itemSource: "SharedStash",
  }));

  return [...characterItems, ...sharedStashItems];
};

const joinRemoveUndefined = (items: (string | undefined)[]) => {
  return items.filter((i) => i !== undefined).join(" ");
};

function isGem(i: Item) {
  return (
    i.type_name.includes("Chipped") ||
    i.type_name.includes("Flawed") ||
    i.type_name.includes("Flawless") ||
    i.type_name === "Skull" ||
    i.type_name.includes("Perfect") ||
    i.type_name.includes("Amethyst") ||
    i.type_name.includes("Sapphire") ||
    i.type_name.includes("Ruby") ||
    i.type_name.includes("Topaz") ||
    i.type_name.includes("Emerald") ||
    i.type_name.includes("Diamond")
  );
}

function sortbyReducer(state: string[], action: string): string[] {
  if (state[0] && state[0] == action) {
    return state.filter((s) => s !== action);
  }
  if (action in state) {
    return [action, ...state.filter((s) => s !== action)];
  } else {
    return [action, ...state];
  }
}

interface ColumnHeaderProps {
  title: string;
  sortByKey?: string;
  onPress?: (sortByKey: string) => void;
  width?: number;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  onPress,
  title,
  sortByKey,
  width,
}) => {
  if (onPress === undefined || sortByKey == undefined) {
    return (
      <ColumnText width={width} textAlign="center">
        {title}
      </ColumnText>
    );
  }
  return (
    <TouchableOpacity onPress={() => onPress(sortByKey)}>
      <ColumnText width={width} textAlign="center">
        {title}
      </ColumnText>
    </TouchableOpacity>
  );
};

interface SetFilterCheckbox {
  type: "SetFilterCheckbox";
  key: string;
  value: boolean;
}

interface SetSerchtermAction {
  type: "SetSearchterm";
  searchTerm: string;
}

interface SetState {
  type: "SetState";
  state: any;
}

interface SearchAndFilterState {
  searchTerm: string;
  checkboxes: Record<string, boolean>;
}

const initialSearchAndFilterState = {
  searchTerm: "",
  checkboxes: {
    showUnique: true,
    showSets: true,
    showGems: false,
    showRunes: false,
    showSocketed: false,
    onlyShowFilters: false,
  },
};

const setFilterCheckbox = (key: string, value: boolean): SetFilterCheckbox => ({
  type: "SetFilterCheckbox",
  key,
  value,
});

const searchAndFilterReducer = (
  state: SearchAndFilterState,
  action: SetFilterCheckbox | SetSerchtermAction | SetState
): SearchAndFilterState => {
  switch (action.type) {
    case "SetFilterCheckbox":
      return {
        ...state,
        checkboxes: {
          ...state.checkboxes,
          [action.key]: action.value,
        },
      };
    case "SetSearchterm":
      return { ...state, searchTerm: action.searchTerm };
    case "SetState":
      return action.state;
    default:
      return state;
  }
};

export default function App() {
  const [searchAndFilter, dispatchSearchAndFilter] = useStoredReducer(
    searchAndFilterReducer,
    initialSearchAndFilterState,
    "searchAndFilter"
  );

  const {
    searchTerm,
    checkboxes: {
      showUnique,
      showSets,
      showGems,
      showRunes,
      showSocketed,
      onlyShowFilters,
    },
  } = searchAndFilter;
  const [totalState, setTotalState] = useState<null | State>(null);

  const allItems = fixyfix(totalState);

  let itemsToShow =
    searchTerm.length === 0
      ? allItems
      : allItems.filter(
          (item) =>
            item.type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.unique_name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            item.set_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

  // itemsToShow = _.uniqBy(itemsToShow, "type_name");
  itemsToShow = itemsToShow.filter((i) => {
    if (i.unique_name !== undefined) {
      return showUnique;
    }
    if (i.set_name !== undefined) {
      return showSets;
    }
    if (isGem(i)) {
      return showGems;
    }
    if (i.type_name.includes("Rune")) {
      return showRunes;
    }
    if (i.socketed) {
      return showSocketed;
    }
    return !onlyShowFilters;
  });

  const [ws, setWs] = useState<null | WebSocket>(null);

  const wsLog = (prefix: string) => (msg: MessageEvent | Event) =>
    console.log(prefix, msg);
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.onmessage = (e: MessageEvent) => {
      try {
        const totalState = JSON.parse(e.data);
        setTotalState(totalState);
        console.log("set new state");
      } catch {
        console.log("Data from backend", e);
      }
    };
    ws.onopen = () => {
      ws.send("helo");
      wsLog("onOpen");
    };
    ws.onclose = wsLog("onClose");
    ws.onerror = wsLog("onError");
    setWs(ws);
  }, []);

  const [sortOrder, dispatchSortBy] = useReducer(sortbyReducer, []);

  itemsToShow = _.orderBy(itemsToShow, sortOrder);

  if (ws === null) {
    return (
      <SafeAreaView>
        <View style={styles.container}>
          <ModeText>Ws is null</ModeText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <TextInput
          placeholder={"Filter"}
          placeholderTextColor="#ccc"
          style={styles.searchField}
          value={searchTerm}
          onChangeText={(searchTerm) =>
            dispatchSearchAndFilter({
              type: "SetSearchterm",
              searchTerm,
            })
          }
        />
        <View>
          <ModeText>
            Showing {itemsToShow.length}/{allItems.length} items
          </ModeText>
        </View>

        <View style={styles.filterRow}>
          <FilterSelect
            titleColor="goldenrod"
            title="Unique"
            value={showUnique}
            onValueChange={(value) =>
              dispatchSearchAndFilter(setFilterCheckbox("showUnique", value))
            }
          />
          <FilterSelect
            titleColor="lime"
            title="Sets"
            value={showSets}
            onValueChange={(value) =>
              dispatchSearchAndFilter(setFilterCheckbox("showSets", value))
            }
          />
          <FilterSelect
            title="Gems"
            value={showGems}
            onValueChange={(value) =>
              dispatchSearchAndFilter(setFilterCheckbox("showGems", value))
            }
          />
          <FilterSelect
            title="Runes"
            value={showRunes}
            onValueChange={(value) =>
              dispatchSearchAndFilter(setFilterCheckbox("showRunes", value))
            }
          />
          <FilterSelect
            title="Socketed"
            value={showSocketed}
            onValueChange={(value) =>
              dispatchSearchAndFilter(setFilterCheckbox("showSocketed", value))
            }
          />
          <FilterSelect
            title="Only show Filters"
            value={onlyShowFilters}
            onValueChange={(value) =>
              dispatchSearchAndFilter(
                setFilterCheckbox("onlyShowFilters", value)
              )
            }
          />
        </View>
        <ItemRow style={styles.tableHeader}>
          <ColumnHeader
            title="Item Source"
            sortByKey="itemSource"
            onPress={dispatchSortBy}
            width={120}
          />
          <ColumnHeader
            title="Item Level"
            sortByKey="level"
            onPress={dispatchSortBy}
            width={60}
          />
          <ColumnHeader
            title="Sockets"
            sortByKey="total_nr_of_sockets"
            onPress={dispatchSortBy}
            width={60}
          />
          <ColumnHeader title="Rare Names" width={120} />
          <ColumnHeader
            title="Name"
            onPress={dispatchSortBy}
            sortByKey="type_name"
          />
          <ColumnHeader title="Unique/Set Name" />
        </ItemRow>
        <ScrollView>
          {itemsToShow.map((item) => {
            const uniqueOrSetName = item.set_name || item.unique_name;
            let uniqueOrSetStyle = styles.linkText;
            if (item.set_name) {
              uniqueOrSetStyle = styles.setItemText;
            }

            return (
              <ItemRow style={styles.itemRow}>
                <ColumnText width={120} textAlign="center">
                  {item.itemSource}
                </ColumnText>
                <ColumnText width={60} textAlign="center">
                  {item.level}
                </ColumnText>
                <ColumnText width={60} textAlign="center">
                  {item.total_nr_of_sockets === 0
                    ? ""
                    : `${item.nr_of_items_in_sockets}/${item.total_nr_of_sockets}`}
                </ColumnText>
                <ColumnText width={120}>
                  {joinRemoveUndefined([item.rare_name, item.rare_name2])}
                </ColumnText>
                <ColumnText>{`${
                  item.magic_prefix_name ? item.magic_prefix_name + " " : ""
                }${item.type_name}${
                  item.magic_suffix_name ? " of " + item.magic_suffix_name : ""
                }`}</ColumnText>

                {uniqueOrSetName && (
                  <Link
                    to={`https://diablo.fandom.com/wiki/${
                      item.set_name || item.unique_name
                    }`}
                  >
                    <ModeText style={uniqueOrSetStyle}>
                      {uniqueOrSetName}
                    </ModeText>
                  </Link>
                )}
                {!uniqueOrSetName && <ColumnText />}
              </ItemRow>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#444",
    alignItems: "center",
    paddingTop: 20,
  },
  filterRow: {
    flexDirection: "row",
  },
  cellWidth: {
    width: 260,
  },
  linkText: {
    color: "goldenrod",
  },
  setItemText: {
    color: "lime",
  },
  itemRow: {
    flexDirection: "row",
  },
  searchField: {
    color: "white",
    backgroundColor: "#888",
    fontSize: 16,
    marginBottom: 20,
  },
  tableHeader: {
    borderTopWidth: 2,
    borderTopColor: "white",
    borderBottomWidth: 2,
    borderBottomColor: "white",
  },
});

const ItemRow = styled(View)`
  flex-direction: row;

  &:hover {
    opacity: 0.6;
    background-color: #333;
  }
`;

const ColumnText = styled(ModeText)<{
  width?: number;
  textAlign?: "left" | "center" | "right";
}>`
  width: ${(props) => (props.width ? `${props.width}px` : "260px")};
  justify-content: center;
  align-items: center;
  text-align: ${(props) => (props.textAlign ? props.textAlign : "left")};
`;
