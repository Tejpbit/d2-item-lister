import React, { useEffect, useState } from "react";
import {
  Linking,
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

export default function App() {
  const [totalState, setTotalState] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnique, setShowUnique] = useState(true);
  const [showSets, setShowSets] = useState(true);
  const [showGems, setShowGems] = useState(false);
  const [showRunes, setShowRunes] = useState(false);
  const [onlyShowFilters, setOnlyShowFilters] = useState(false);

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
    return !onlyShowFilters;
  });

  // itemsToShow = _.orderBy(itemsToShow, "level");

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
        console.log("Not json");
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
          onChangeText={setSearchTerm}
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
            onValueChange={setShowUnique}
          />
          <FilterSelect
            titleColor="lime"
            title="Sets"
            value={showSets}
            onValueChange={setShowSets}
          />
          <FilterSelect
            title="Gems"
            value={showGems}
            onValueChange={setShowGems}
          />
          <FilterSelect
            title="Runes"
            value={showRunes}
            onValueChange={setShowRunes}
          />
          <FilterSelect
            title="Only show Filters"
            value={onlyShowFilters}
            onValueChange={setOnlyShowFilters}
          />
        </View>
        <ItemRow style={styles.tableHeader}>
          <ColumnText width={120} textAlign="center">
            Item Source
          </ColumnText>
          <ColumnText width={60} textAlign="center">
            Item Level
          </ColumnText>
          <ColumnText width={60} textAlign="center">
            Sockets
          </ColumnText>
          <ColumnText width={120} textAlign="center">
            Rare Names
          </ColumnText>
          <ColumnText textAlign="center">Name</ColumnText>
          <ColumnText textAlign="center">Unique/Set Name</ColumnText>
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
                    : item.total_nr_of_sockets}
                </ColumnText>
                <ColumnText width={120}>
                  {joinRemoveUndefined([item.rare_name, item.rare_name2])}
                </ColumnText>
                <ColumnText>{`${
                  item.magic_prefix_name ? item.magic_prefix_name + " " : ""
                }${item.type_name}${
                  item.magic_suffix_name ? " of " + item.magic_suffix_name : ""
                }`}</ColumnText>
                {/*ItemsEntity*/}
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      `https://diablo.fandom.com/wiki/${
                        item.set_name || item.unique_name
                      }`
                    )
                  }
                >
                  <LinkText style={uniqueOrSetStyle}>
                    {uniqueOrSetName}
                  </LinkText>
                </TouchableOpacity>
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
  linkText: {
    width: 260,
    color: "goldenrod",
  },
  setItemText: {
    width: 260,
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
const LinkText = styled(ColumnText)`
  color: lightblue;
`;
