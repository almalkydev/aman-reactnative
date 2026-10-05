import React from "react";
import { View, Modal, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { Check, ChevronDown, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, useColors } from "../../lib/provider";
import { PressableScale } from "../motion";
import { Text, Row } from "./typography";
import { Label } from "./controls";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const c = useColors();
  const { dark, t } = useApp();
  const inset = useSafeAreaInsets();
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <BlurView
          intensity={30}
          tint={dark ? "dark" : "light"}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#00000055",
          }}
        />
        <PressableScale
          onPress={onClose}
          label={t("dismiss")}
          style={{ position: "absolute", inset: 0 }}
        >
          <View style={{ height: "100%" }} />
        </PressableScale>
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: c.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: Math.max(inset.bottom, 24),
            maxHeight: "85%",
            width: "100%",
            maxWidth: 680,
            alignSelf: "center",
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 4,
              backgroundColor: c.border,
              alignSelf: "center",
              marginBottom: 20,
            }}
          />
          <Row style={{ justifyContent: "space-between", marginBottom: 24 }}>
            <Text size={21} weight="semibold">
              {title}
            </Text>
            <PressableScale onPress={onClose} label={t("closeViewer")}>
              <View style={{ padding: 8 }}>
                <X size={20} color={c.muted} />
              </View>
            </PressableScale>
          </Row>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 12 }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export const Dialog = Sheet;

export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: any) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const c = useColors();
  const { t } = useApp();
  return (
    <View>
      <Label>{label}</Label>
      <PressableScale onPress={() => setOpen(true)}>
        <Row
          style={{
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 12,
            minHeight: 48,
            paddingHorizontal: 14,
            justifyContent: "space-between",
          }}
        >
          <Text>
            {options.find((o) => o.value === value)?.label || t("choose")}
          </Text>
          <ChevronDown size={17} color={c.muted} />
        </Row>
      </PressableScale>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        {options.map((o) => (
          <PressableScale
            key={o.value}
            onPress={() => {
              onChange(o.value);
              setOpen(false);
            }}
          >
            <Row
              style={{ paddingVertical: 14, justifyContent: "space-between" }}
            >
              <Text>{o.label}</Text>
              {o.value === value ? (
                <Check size={18} color={c.foreground} />
              ) : null}
            </Row>
          </PressableScale>
        ))}
      </Sheet>
    </View>
  );
}
