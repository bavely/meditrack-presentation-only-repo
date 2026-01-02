import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import Button from "../../components/ui/Button";
// Define DoseTime type if not imported from elsewhere
type DoseTime = {
  id: string;
  scheduledAt: string;
};

export default function MedicationRegisteredScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data?: string }>();
  const parsed = data ? JSON.parse(data as string) : null;
  const medication = parsed?.medication;
  const schedule = parsed?.schedule;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black p-4">
      <ScrollView className="flex-1">
        <Text className="text-xl font-bold text-black dark:text-white mb-4">
          Medication Registered
        </Text>
        {medication && (
          <View className="mb-4">
            <Text className="text-black dark:text-white">Name: {medication.name}</Text>
            <Text className="text-black dark:text-white">Strength: {medication.strength}</Text>
            <Text className="text-black dark:text-white">Quantity: {medication.quantity}</Text>
            <Text className="text-black dark:text-white">Instructions: {medication.instructions}</Text>
            <Text className="text-black dark:text-white">Therapy: {medication.therapy}</Text>
          </View>
        )}
        {schedule && (
          <View className="mb-4">
            <Text className="text-black dark:text-white">Dosage to be taken: {schedule.frequency} {schedule.repeatPattern}</Text>
            <Text className="text-black dark:text-white">Start Date: {new Date(schedule.startDate).toLocaleString()}</Text>
            <Text className="text-black dark:text-white">Duration: {schedule.durationDays} days</Text>
            <View className="mt-2">
              <Text className="text-black dark:text-white">Upcoming Dose Time:</Text>
                {(
                (schedule?.doseTimes as DoseTime[] | undefined)?.slice().sort((a, b) =>
                 new Date(b.scheduledAt).getDate() - new Date(a.scheduledAt).getDate()
                ) ?? []
                ).map((dose: DoseTime) => (
                <Text key={dose.id} className="text-black dark:text-white ml-2">
                  {dose.scheduledAt ? dayjs(dose.scheduledAt).format('MM/DD/YYYY hh:mm A') : ''}
                </Text>
                ))}
            </View>
          </View>
        )}
        <Button title="OK" onPress={() => router.push('/(tabs)')} />
      </ScrollView>
    </SafeAreaView>
  );
}
