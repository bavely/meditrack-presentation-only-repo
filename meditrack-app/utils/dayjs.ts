// utils/dayjs.ts
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

// Optional: set default to the device timezone
dayjs.tz.setDefault(dayjs.tz.guess());

export default dayjs;