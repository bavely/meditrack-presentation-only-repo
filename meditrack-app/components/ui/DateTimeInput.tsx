import * as React from "react";
import { Pressable } from "react-native";
import { HelperText, TextInput } from "react-native-paper";
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates";

type DateTimeInputProps = {
  label: string;
  value: Date | null | undefined;
  onChange: (d: Date | null) => void;
  locale?: string;                      // e.g. "en", "ar-EG"
  use24HourClock?: boolean;
  validRange?: { startDate?: Date; endDate?: Date; disabledDates?: Date[] };
  disabled?: boolean;
  error?: string | null;
  presentationStyle?: "overFullScreen" | "pageSheet";
  helperText?: string;
};

export function DateTimeInput({
  label,
  value,
  onChange,
  locale = "en",
  use24HourClock,
  validRange,
  disabled,
  error,
  presentationStyle,
  helperText,
}: DateTimeInputProps) {
  const [openDate, setOpenDate] = React.useState(false);
  const [openTime, setOpenTime] = React.useState(false);
  const [tmpDate, setTmpDate] = React.useState<Date | null>(value ?? null);

  const formatted = React.useMemo(() => {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(value);
    } catch {
      return value.toLocaleString();
    }
  }, [value, locale]);

  const openPickers = React.useCallback(() => {
    setTmpDate(value ?? new Date());
    setOpenDate(true);
  }, [value]);

  const onConfirmDate = React.useCallback(
    (params: { date?: Date; startDate?: Date; endDate?: Date }) => {
      setOpenDate(false);
      // Support both 'single' and 'range' modes, but only handle 'single' here
      const date = params.date ?? params.startDate ?? new Date();
      const hours = value ? value.getHours() : new Date().getHours();
      const minutes = value ? value.getMinutes() : new Date().getMinutes();
      setTmpDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes));
      setOpenTime(true);
    },
    [value]
  );

  const onDismissDate = () => setOpenDate(false);

  const onConfirmTime = ({ hours, minutes }: { hours: number; minutes: number }) => {
    setOpenTime(false);
    const base = (tmpDate ?? new Date());
    const next = new Date(
      base.getFullYear(), base.getMonth(), base.getDate(),
      hours, minutes, 0, 0
    );
    onChange(next);
  };

  const onDismissTime = () => setOpenTime(false);
  const clear = () => onChange(null);

  const baseForTime = value ?? new Date();

  return (
    <>
      <Pressable onPress={openPickers}>
        <TextInput
          label={label}
          value={formatted}
          editable={false}
          onPressIn={openPickers}
          right={
            <TextInput.Icon
              icon={value ? "close" : "calendar-clock"}
              onPress={value ? clear : openPickers}
            />
          }
          error={!!error}
          disabled={disabled}
          mode="outlined"
        />
      </Pressable>

      <DatePickerModal
        locale={locale}
        mode="single"
        visible={openDate}
        date={tmpDate ?? value ?? new Date()}
        onDismiss={onDismissDate}
        onConfirm={onConfirmDate}
        // validRange={validRange}
        presentationStyle={presentationStyle}
        
      />

      <TimePickerModal
        locale={locale}
        visible={openTime}
        onDismiss={onDismissTime}
        onConfirm={onConfirmTime}
        hours={baseForTime.getHours()}
        minutes={baseForTime.getMinutes()}
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
