import * as Localization from "expo-localization";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, Switch, Text, TextInput, View } from "react-native";
import { Divider } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import { DateTimeInput } from "../../components/ui/DateTimeInput";
import { registerMedicationAI } from '../../services/medicationService';
import { useMedicationStore } from "../../store/medication-store";
const Confirmation = () => {
  const { parsedMedication } = useMedicationStore();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState(parsedMedication?.name || "");
  const [strength, setStrength] = useState(parsedMedication?.strength || "");
  const [instructions, setInstructions] = useState(
    parsedMedication?.instructions || ""
  );
  const [therapy, setTherapy] = useState(parsedMedication?.therapy || "");
  const [totalCount, setTotalCount] = useState(Number(parsedMedication?.quantity) || 0);
  const [firstTime, setFirstTime] = useState<Date | null>(null);
  const [lastTime, setLastTime] = useState<Date | null>(null);
  const [isFirstDose, setIsFirstDose] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const progress = useSharedValue(0);
  const translateX = useSharedValue(0);
  const TOTAL_STEPS = 3;
  const screenWidth = Dimensions.get("window").width;
  console.log("🔍 Parsed Medication:", parsedMedication);
  useEffect(() => {
    console.log("🔍 Parsed Medication :", parsedMedication);
    setName(parsedMedication?.name || "");
    setStrength(parsedMedication?.strength || "");
    setInstructions(parsedMedication?.instructions || "");
    setTherapy(parsedMedication?.therapy || "");
    setTotalCount(Number(parsedMedication?.quantity) || 0);
  }, [parsedMedication]);

  useEffect(() => {
    progress.value = withTiming((currentStep + 1) / TOTAL_STEPS, {
      duration: 300,
    });
    translateX.value = withTiming(0, { duration: 300 });
  }, [currentStep, progress, TOTAL_STEPS, translateX]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const stepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      translateX.value = screenWidth;
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      translateX.value = -screenWidth;
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    if (currentStep < TOTAL_STEPS - 1) {
      handleNext();
      return;
    }

    if (isFirstDose) {
      setLastTime(firstTime);
    }

    const updatedMedication = {
      name,
      strength,
      instructions,
      therapy,
      totalCount : Number(totalCount),
      firstTime,
      lastTime: isFirstDose ? firstTime : lastTime,
    };
    console.log("Saving medication: ================> try this", updatedMedication);
    registerMedicationAI(updatedMedication)
      .then(res => {
        console.log(JSON.stringify(res));
        const data = res.data?.registerMedicationWithAi?.data;
        setIsLoading(false);
        router.push(`/medication/registered?data=${JSON.stringify(data)}`);
      })
      .catch(err => {
        console.log(JSON.stringify(err));
        setIsLoading(false);
      });

  };

  const handleEdit = () => {
  if (currentStep < TOTAL_STEPS - 1) {
      handleNext();
    }
  };

  const handleSaveAndNext = () => {
        if (currentStep < TOTAL_STEPS - 1) {
      translateX.value = screenWidth;
      setCurrentStep((prev) => prev + 2);
    }
  }

  const handleBackToConfirmation = () => {
    if (currentStep > 0) {
      translateX.value = -screenWidth;
      setCurrentStep((prev) => prev - 2);
    }
  };

  if (!parsedMedication) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-black">
        <Text className="text-black dark:text-white">
          No medication data available.
        </Text>
      </SafeAreaView>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View className="grid gap-2 ">
            <Text className="text-black dark:text-white">Name: {name}</Text>
            <Text className="text-black dark:text-white">Strength: {strength}</Text>
            <Text className="text-black dark:text-white">
              Instructions: {instructions}
            </Text>
            <Text className="text-black dark:text-white">Therapy: {therapy}</Text>
            <Text className="text-black dark:text-white">
              Total Count: {totalCount}
            </Text>
            <Button title="Edit" onPress={handleEdit} />
            <Button title="Confirm / Next" onPress={handleSaveAndNext} />
          </View>
        );
      case 1:
        return (
          <View className="grid gap-2 ">
            <Text className="text-black dark:text-white">Name</Text>
            <TextInput
              className="border-2 border-gray-300 rounded-md p-2 text-black dark:text-white"
              value={name}
              onChangeText={setName}
            />
            <Divider className="bg-gray-600" />
            <Text className="text-black dark:text-white">Strength</Text>
            <TextInput
              className="border-2 border-gray-300 rounded-md p-2 text-black dark:text-white"
              value={strength}
              onChangeText={setStrength}
            />
            <Divider className="bg-gray-600" />
            <Text className="text-black dark:text-white">Instructions</Text>
            <TextInput
              className="border-2 border-gray-300 rounded-md p-2 text-black dark:text-white"
              value={instructions}
              onChangeText={setInstructions}
            />
            <Divider className="bg-gray-600" />
            <Text className="text-black dark:text-white">Therapy</Text>
            <TextInput
              className="border-2 border-gray-300 rounded-md p-2 text-black dark:text-white"
              value={therapy}
              onChangeText={setTherapy}
            />
            <Divider className="bg-gray-600" />
            <Text className="text-black dark:text-white">Total Count</Text>
            <TextInput
              className="border-2 border-gray-300 rounded-md p-2 text-black dark:text-white"
              value={totalCount.toString()}
              onChangeText={(text) => setTotalCount(parseInt(text))}
            />
            <Button title="Save" onPress={handleBack} />
          </View>
        );
      case 2:
        return (
          <View className="grid gap-2">
            {/* First and Last Time Medication Taken Goes Here */}
            <View className="grid gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-black dark:text-white">
                  This is my first time taking this medication
                </Text>
                <Switch value={isFirstDose} onValueChange={setIsFirstDose} />
              </View>
              <DateTimeInput
                label="When did you first take this medication?"
                helperText="Select the date and time of your first dose."
                value={firstTime}
                onChange={setFirstTime}
                locale={Localization.getLocales()[0].languageTag}
                use24HourClock={false}
                validRange={{ startDate: new Date() }}
              />
              {!isFirstDose && (
                <DateTimeInput
                  label="When was your most recent dose?"
                  helperText="Choose when you last took this medication."
                  value={lastTime}
                  onChange={setLastTime}
                  locale={Localization.getLocales()[0].languageTag}
                  use24HourClock={false}
                  validRange={{ startDate: new Date() }}
                />
              )}
            </View>
            <Button title="Back" onPress={handleBackToConfirmation} />
            <Button title="Submit" onPress={handleSave} disabled={isLoading} loading={isLoading} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 pt-12 bg-white dark:bg-black">
      <View className="p-4 gap-4">
        <View className="mb-4">
          <View className="h-2 bg-gray-300 rounded">
            <Animated.View
              className="h-full bg-blue-500 rounded"
              style={progressStyle}
            />
          </View>
          <Text className="mt-2 text-center text-black dark:text-white">
            Step {currentStep + 1} of {TOTAL_STEPS}
          </Text>
        </View>
        <Animated.View style={stepStyle}>{renderStep()}</Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default Confirmation;

