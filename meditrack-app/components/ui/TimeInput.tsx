import * as React from "react";
import { Pressable } from "react-native";
import { HelperText, TextInput } from "react-native-paper";
import { TimePickerModal } from "react-native-paper-dates";

interface TimeInputProps {
  label: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  locale?: string; // e.g. "en", "ar-EG"
  use24HourClock?: boolean;
  disabled?: boolean;
  error?: string | null;
  presentationStyle?: "overFullScreen" | "pageSheet";
  helperText?: string;
}

export function TimeInput({
  label,
  value,
  onChange,
  locale = "en",
  use24HourClock,
  disabled,
  error,
  presentationStyle,
  helperText,
}: TimeInputProps) {
  const [open, setOpen] = React.useState(false);

  const formatted = value ?? "";

  const openPicker = React.useCallback(() => setOpen(true), []);
  const onDismiss = () => setOpen(false);
  const clear = () => onChange(null);

  const onConfirm = ({ hours, minutes }: { hours: number; minutes: number }) => {
    setOpen(false);
    const h = String(hours).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");
    onChange(`${h}:${m}`);
  };

  const baseDate = React.useMemo(() => {
    if (!value) return new Date();
    const [h, m] = value.split(":").map((n) => parseInt(n, 10));
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  }, [value]);

  return (
    <>
      <Pressable onPress={openPicker}>
        <TextInput
          label={label}
          value={formatted}
          editable={false}
          onPressIn={openPicker}
          right={
            <TextInput.Icon
              icon={value ? "close" : "clock"}
              onPress={value ? clear : openPicker}
            />
          }
          error={!!error}
          disabled={disabled}
          mode="outlined"
        />
      </Pressable>

      <TimePickerModal
        locale={locale}
        visible={open}
        onDismiss={onDismiss}
        onConfirm={onConfirm}
        hours={baseDate.getHours()}
        minutes={baseDate.getMinutes()}
        use24HourClock={use24HourClock}
      />

      {!!helperText && (
        <HelperText type="info" visible>
          {helperText}
        </HelperText>
      )}
      {!!error && <HelperText type="error" visible>{error}</HelperText>}
    </>
  );
}
