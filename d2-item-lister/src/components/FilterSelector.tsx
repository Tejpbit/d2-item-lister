import { CheckBox, Text, View, StyleSheet } from "react-native";
import React from "react";
import { ModeText } from "./ModeText";

export function FilterSelect({
  value,
  onValueChange,
  title,
}: {
  value: boolean;
  onValueChange: (value: ((prevState: boolean) => boolean) | boolean) => void;
  title: string;
}) {
  return (
    <View style={styles.container}>
      <ModeText style={styles.text}>{title}</ModeText>
      <CheckBox value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 5,
    paddingLeft: 5,
  },
  text: {
    paddingRight: 2,
  },
});
