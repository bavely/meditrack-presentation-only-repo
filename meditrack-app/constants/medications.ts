// Mock medication data
export const medications = [
  {
    id: "1",
    name: "Lisinopril",
    strength: "10mg",
    frequency: "Once daily",
    time: "09:00",
    instructions: "Take with or without food",
    color: "#4A80F0",
    icon: "pill",
    refillDate: "2025-07-15",
    quantity: 30,
    remainingDoses: 12,
  },
  {
    id: "2",
    name: "Metformin",
    strength: "500mg",
    frequency: "Twice daily",
    time: ["08:00", "20:00"],
    instructions: "Take with meals",
    color: "#F5C5D1",
    icon: "pill",
    refillDate: "2025-07-10",
    quantity: 60,
    remainingDoses: 24,
  },
  {
    id: "3",
    name: "Atorvastatin",
    strength: "20mg",
    frequency: "Once daily",
    time: "21:00",
    instructions: "Take in the evening",
    color: "#FFB156",
    icon: "pill",
    refillDate: "2025-07-20",
    quantity: 30,
    remainingDoses: 18,
  },
  {
    id: "4",
    name: "Vitamin D",
    strength: "1000 IU",
    frequency: "Once daily",
    time: "12:00",
    instructions: "Take with food",
    color: "#4CD964",
    icon: "pill",
    refillDate: "2025-08-05",
    quantity: 90,
    remainingDoses: 65,
  },
];

// Mock medication history
export const medicationHistory = [
  {
    id: "1",
    medicationId: "1",
    date: "2025-06-28",
    time: "09:05",
    status: "taken",
  },
  {
    id: "2",
    medicationId: "2",
    date: "2025-06-28",
    time: "08:10",
    status: "taken",
  },
  {
    id: "3",
    medicationId: "2",
    date: "2025-06-28",
    time: "20:15",
    status: "taken",
  },
  {
    id: "4",
    medicationId: "3",
    date: "2025-06-28",
    time: "21:30",
    status: "taken",
  },
  {
    id: "5",
    medicationId: "1",
    date: "2025-06-27",
    time: "09:15",
    status: "taken",
  },
  {
    id: "6",
    medicationId: "2",
    date: "2025-06-27",
    time: "08:05",
    status: "taken",
  },
  {
    id: "7",
    medicationId: "2",
    date: "2025-06-27",
    time: "20:00",
    status: "missed",
  },
  {
    id: "8",
    medicationId: "3",
    date: "2025-06-27",
    time: "21:00",
    status: "taken",
  },
];

// Upcoming doses for today
export const upcomingDoses = [
  {
    id: "1",
    medicationId: "1",
    name: "Lisinopril",
    strength: "10mg",
    time: "09:00",
    color: "#4A80F0",
    icon: "pill",
  },
  {
    id: "2",
    medicationId: "2",
    name: "Metformin",
    strength: "500mg",
    time: "08:00",
    color: "#F5C5D1",
    icon: "pill",
  },
  {
    id: "3",
    medicationId: "2",
    name: "Metformin",
    strength: "500mg",
    time: "20:00",
    color: "#F5C5D1",
    icon: "pill",
  },
  {
    id: "4",
    medicationId: "3",
    name: "Atorvastatin",
    strength: "20mg",
    time: "21:00",
    color: "#FFB156",
    icon: "pill",
  },
];

// Medication types for selection
export const medicationTypes = [
  { id: "1", name: "Pill", icon: "pill" },
  { id: "2", name: "Liquid", icon: "droplet" },
  { id: "3", name: "Injection", icon: "syringe" },
  { id: "4", name: "Inhaler", icon: "wind" },
  { id: "5", name: "Topical", icon: "hand" },
  { id: "6", name: "Eye Drops", icon: "eye" },
];

// Frequency options
export const frequencyOptions = [
  { id: "1", name: "Once daily", value: "once_daily" },
  { id: "2", name: "Twice daily", value: "twice_daily" },
  { id: "3", name: "Three times daily", value: "thrice_daily" },
  { id: "4", name: "Every other day", value: "every_other_day" },
  { id: "5", name: "Weekly", value: "weekly" },
  { id: "6", name: "As needed", value: "as_needed" },
  { id: "7", name: "Custom", value: "custom" },
];


export const colors = [
  "#ef4444", "#fca5a5", "#fed7aa", "#a78bfa", "#fb923c",
  "#dc2626", "#fef3c7", "#a16207", "#fef08a", "#4338ca",
  "#4c1d95", "#809900", "#4a044e", "#6680B3", "#66991A",
  "#FF99E6", "#CCFF1A", "#FF1A66", "#E6331A", "#33FFCC",
  "#66994D", "#B366CC", "#4D8000", "#B33300", "#CC80CC",
  "#66664D", "#991AFF", "#E666FF", "#4DB3FF", "#1AB399",
  "#E666B3", "#33991A", "#CC9999", "#B3B31A", "#00E680",
  "#4D8066", "#809980", "#E6FF80", "#1AFF33", "#999933",
  "#FF3380", "#CCCC00", "#66E64D", "#4D80CC", "#9900B3",
  "#E64D66", "#4DB380", "#FF4D4D", "#99E6E6", "#6666FF"
];