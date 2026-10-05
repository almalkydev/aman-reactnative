import React from "react";
import {
  View,
  TextInput,
  ScrollView,
  StyleProp,
  ViewStyle,
  TextInputProps,
  StyleSheet,
} from "react-native";
import { MotiView } from "moti";
import * as SwitchPrimitive from "@rn-primitives/switch";
import * as ProgressPrimitive from "@rn-primitives/progress";
import { useApp, useColors } from "../../lib/provider";
import { PressableScale, PulseGlow } from "../motion";
import { Text, Row } from "./typography";

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const { dark, reduced } = useApp();
  const overrides = StyleSheet.flatten(style);
  return (
    <MotiView
      className="rounded-xl"
      animate={{
        backgroundColor: (overrides?.backgroundColor || c.card) as string,
        borderColor: (overrides?.borderColor || c.border) as string,
      }}
      transition={{ type: "timing", duration: reduced ? 0 : 250 }}
      style={[
        {
          backgroundColor: c.card,
          borderColor: c.border,
          borderWidth: 1,
          padding: 18,
          borderRadius: 16,
          ...(!dark
            ? { boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }
            : { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }),
        },
        style,
      ]}
    >
      {children}
    </MotiView>
  );
}

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  icon,
}: {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const c = useColors();
  const primary = variant === "primary",
    danger = variant === "danger";
  return (
    <PressableScale disabled={disabled} onPress={onPress}>
      <View
        style={{
          height: 48,
          paddingHorizontal: 18,
          borderRadius: 12,
          backgroundColor: primary
            ? c.foreground
            : danger
              ? c.danger
              : variant === "secondary"
                ? c.card
                : "transparent",
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: c.border,
          justifyContent: "center",
        }}
      >
        <Row style={{ justifyContent: "center" }}>
          {icon}
          <Text
            weight="semibold"
            style={{
              color: primary ? c.background : danger ? "#fff" : c.foreground,
            }}
          >
            {children}
          </Text>
        </Row>
      </View>
    </PressableScale>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text weight="medium" size={13} style={{ marginBottom: 8 }}>
      {children}
    </Text>
  );
}

export function Input({
  label,
  helper,
  ...props
}: TextInputProps & { label?: string; helper?: string }) {
  const c = useColors();
  const { rtl } = useApp();
  const [focus, setFocus] = React.useState(false);
  return (
    <View style={{ gap: 0 }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        {...props}
        accessibilityLabel={label || props.placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholderTextColor={c.muted}
        style={[
          {
            minHeight: 48,
            borderWidth: 1,
            borderColor: focus ? c.foreground : c.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: c.foreground,
            backgroundColor: c.card,
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            textAlign: rtl ? "right" : "left",
            writingDirection: rtl ? "rtl" : "ltr",
          },
          props.multiline ? { minHeight: 120, textAlignVertical: "top" } : {},
          props.style,
        ]}
      />
      {helper ? (
        <Text muted size={12} style={{ marginTop: 6 }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

export function Badge({ value }: { value: string }) {
  const { t } = useApp();
  const c = useColors();
  const color = ["completed", "closed", "pass"].includes(value)
    ? c.success
    : ["critical", "high", "failed", "fail"].includes(value)
      ? c.danger
      : ["open", "in_progress", "medium", "pending"].includes(value)
        ? c.warning
        : c.muted;
  const content = (
    <Row
      style={{
        gap: 5,
        borderRadius: 99,
        paddingHorizontal: 9,
        paddingVertical: 4,
        backgroundColor: color + "14",
        alignSelf: "flex-start",
      }}
    >
      <View
        style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }}
      />
      <Text size={11} weight="medium" style={{ color }}>
        {t(value)}
      </Text>
    </Row>
  );
  return value === "critical" ? <PulseGlow>{content}</PulseGlow> : content;
}

export function Separator() {
  const c = useColors();
  return (
    <View
      style={{ height: 1, backgroundColor: c.border, marginVertical: 16 }}
    />
  );
}

export function Progress({ value }: { value: number }) {
  const c = useColors();
  const { reduced } = useApp();
  return (
    <ProgressPrimitive.Root
      value={Math.round(value * 100)}
      max={100}
      style={{
        height: 5,
        borderRadius: 10,
        backgroundColor: c.border,
        overflow: "hidden",
      }}
    >
      <ProgressPrimitive.Indicator asChild>
        <MotiView
          animate={{ width: `${Math.min(value, 1) * 100}%` }}
          transition={{ type: "timing", duration: reduced ? 0 : 250 }}
          style={{ height: 5, backgroundColor: c.foreground, borderRadius: 10 }}
        />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
}

export function Tabs({
  values,
  value,
  onChange,
}: {
  values: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const c = useColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 7, paddingVertical: 2 }}
    >
      {values.map((v) => (
        <PressableScale key={v.value} onPress={() => onChange(v.value)}>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 9,
              backgroundColor: v.value === value ? c.foreground : c.subtle,
            }}
          >
            <Text
              size={12}
              weight="medium"
              style={{ color: v.value === value ? c.background : c.muted }}
            >
              {v.label}
            </Text>
          </View>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

export function Switch({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const c = useColors();
  return (
    <SwitchPrimitive.Root
      accessibilityLabel={label}
      checked={value}
      onCheckedChange={onChange}
      style={{
        width: 44,
        height: 26,
        borderRadius: 20,
        padding: 3,
        backgroundColor: value ? c.foreground : c.border,
        justifyContent: "center",
      }}
    >
      <SwitchPrimitive.Thumb
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: c.background,
          transform: [{ translateX: value ? 18 : 0 }],
        }}
      />
    </SwitchPrimitive.Root>
  );
}
