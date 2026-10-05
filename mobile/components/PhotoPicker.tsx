import React, { useState } from "react";
import { View, Image, Platform, Modal } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { File, Directory, Paths } from "expo-file-system";
import { Camera, ImagePlus, X } from "lucide-react-native";
import { Row, Button, Sheet } from "./ui";
import { PressableScale } from "./motion";
import { useApp, useColors } from "../lib/provider";
import { ReportPhoto } from "./ReportPhoto";
export function PhotoPicker({
  photos,
  onChange,
  max = 4,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const { t, notify } = useApp();
  const c = useColors();
  async function choose(camera: boolean) {
    setOpen(false);
    try {
      const permission = camera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        notify(t("photoPermission"));
        return;
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({
            quality: 0.7,
            mediaTypes: ["images"],
          })
        : await ImagePicker.launchImageLibraryAsync({
            quality: 0.7,
            mediaTypes: ["images"],
          });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        notify(t("photoTooLarge"));
        return;
      }
      let uri = asset.uri;
      if (Platform.OS === "web") {
        const blob = await (await fetch(uri)).blob();
        uri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        const dir = new Directory(Paths.document, "report-photos");
        dir.create({ idempotent: true, intermediates: true });
        const file = new File(uri);
        const copy = new File(
          dir,
          `${Date.now()}-${Math.random().toString(36).slice(2)}.${uri.split(".").pop() || "jpg"}`,
        );
        file.copy(copy);
        uri = copy.uri;
      }
      onChange([...photos, uri]);
    } catch {
      notify(t("photoPermission"));
    }
  }
  return (
    <View style={{ gap: 10 }}>
      <Row style={{ flexWrap: "wrap" }}>
        {photos.map((uri, i) => (
          <View key={uri} style={{ width: 74, height: 74 }}>
            <Image
              source={{ uri }}
              style={{ width: 74, height: 74, borderRadius: 10 }}
            />
            <PressableScale
              label={t("remove")}
              onPress={() => onChange(photos.filter((_, index) => index !== i))}
              style={{ position: "absolute", top: 2, right: 2 }}
            >
              <View
                style={{
                  padding: 5,
                  borderRadius: 20,
                  backgroundColor: c.card,
                }}
              >
                <X size={12} color={c.foreground} />
              </View>
            </PressableScale>
          </View>
        ))}
      </Row>
      {photos.length < max ? (
        <Button
          variant="secondary"
          onPress={() => setOpen(true)}
          icon={<ImagePlus size={16} color={c.foreground} />}
        >
          {t("addPhoto")}
        </Button>
      ) : null}
      <Sheet
        title={t("permissionHint")}
        open={open}
        onClose={() => setOpen(false)}
      >
        <Button
          variant="secondary"
          onPress={() => void choose(true)}
          icon={<Camera size={18} color={c.foreground} />}
        >
          {t("camera")}
        </Button>
        <Button
          variant="secondary"
          onPress={() => void choose(false)}
          icon={<ImagePlus size={18} color={c.foreground} />}
        >
          {t("gallery")}
        </Button>
      </Sheet>
    </View>
  );
}
export function PhotoGrid({ photos }: { photos: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const { t } = useApp();
  const c = useColors();
  return (
    <>
      <Row style={{ flexWrap: "wrap" }}>
        {photos.map((uri) => (
          <PressableScale key={uri} onPress={() => setSelected(uri)}>
            <ReportPhoto
              uri={uri}
              style={{
                width: 100,
                height: 100,
                borderRadius: 12,
                backgroundColor: c.subtle,
              }}
            />
          </PressableScale>
        ))}
      </Row>
      <Modal
        visible={!!selected}
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#09090bf5",
            justifyContent: "center",
            padding: 20,
          }}
        >
          {selected ? (
            <ReportPhoto
              uri={selected}
              contain
              style={{ width: "100%", height: "75%" }}
            />
          ) : null}
          <Button onPress={() => setSelected(null)}>{t("closeViewer")}</Button>
        </View>
      </Modal>
    </>
  );
}
