import { CheckBox, View, StyleSheet, TextStyle } from "react-native";
import React from "react";
import { ModeText } from "./ModeText";

export function FilterSelect({
  value,
  onValueChange,
  title,
  titleColor,
}: {
  value: boolean;
  onValueChange: (value: ((prevState: boolean) => boolean) | boolean) => void;
  title: string;
  titleColor?: string;
}) {
  const textStyle: TextStyle[] = [styles.text];

  if (titleColor !== undefined) {
    textStyle.push({ color: titleColor });
  }

  return (
    <View style={styles.container}>
      <ModeText style={textStyle}>{title}</ModeText>
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
