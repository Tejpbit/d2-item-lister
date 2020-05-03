import { TouchableOpacity } from "react-native";
import React from "react";

interface Props {
  to: string;
}

export const Link: React.FC<Props> = ({ to, children }) => (
  <TouchableOpacity onPress={() => window.open(to, "_blank")}>
    {children}
  </TouchableOpacity>
);
