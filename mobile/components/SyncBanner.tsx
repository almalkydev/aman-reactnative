import React from "react";
import { View } from "react-native";
import { CloudOff, Check, RefreshCw } from "lucide-react-native";
import { useApp, useColors } from "../lib/provider";
import { Row, Text } from "./ui";
import { PressableScale } from "./motion";
import { MotiView, AnimatePresence } from "moti";
export function SyncBanner() {
  const {
    online,
    pendingCount,
    syncing,
    recentlySynced,
    reduced,
    syncError,
    sync,
    t,
  } = useApp();
  const c = useColors();
  const visible =
    !online || pendingCount > 0 || syncing || !!syncError || recentlySynced;
  return (
    <AnimatePresence>
      {visible ? (
        <MotiView
          key="sync-banner"
          from={{ opacity: reduced ? 1 : 0, translateY: reduced ? 0 : -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: reduced ? 0 : -12 }}
          transition={{ type: "timing", duration: reduced ? 0 : 200 }}
        >
          <PressableScale onPress={() => void sync()} label={t("syncNow")}>
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 9,
                backgroundColor: c.subtle,
                borderBottomWidth: 1,
                borderColor: c.border,
              }}
            >
              <Row style={{ justifyContent: "center" }}>
                {!online ? (
                  <CloudOff size={13} color={c.warning} />
                ) : syncing ? (
                  <MotiView
                    from={{ rotate: "0deg" }}
                    animate={{ rotate: reduced ? "0deg" : "360deg" }}
                    transition={{
                      type: "timing",
                      duration: 1300,
                      loop: !reduced,
                      repeatReverse: false,
                    }}
                  >
                    <RefreshCw size={13} color={c.muted} />
                  </MotiView>
                ) : (
                  <Check size={13} color={c.success} />
                )}
                <Text size={11} muted>
                  {syncError ||
                    (syncing
                      ? t("syncing")
                      : !online
                        ? `${t("offline")} · ${pendingCount} ${t("pending")}`
                        : pendingCount
                          ? `${pendingCount} ${t("pending")}`
                          : t("allSynced"))}
                </Text>
              </Row>
            </View>
          </PressableScale>
        </MotiView>
      ) : null}
    </AnimatePresence>
  );
}
