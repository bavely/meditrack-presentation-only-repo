import { medicationTypes } from "@/constants/medications";
// TODO: Re-enable when form functionality is implemented
// import { useMedicationStore } from "@/store/medication-store";
import { useRouter } from "expo-router";
import {
  Camera,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  Mic,
  Pill
} from "lucide-react-native";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { useColorScheme } from "@/hooks/useColorScheme";

import { Colors } from "../../constants/Colors";
import { borderRadius } from "../../constants/Theme";

export default function AddMedicationScreen() {
  const router = useRouter();
  // TODO: Implement form functionality
  // const { addMedication } = useMedicationStore();
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  
  // TODO: Implement form functionality
  // const [name, setName] = useState("");
  // const [dosage, setDosage] = useState("");
  // const [frequency, setFrequency] = useState("");
  // const [time, setTime] = useState("09:00");
  // const [instructions, setInstructions] = useState("");
  // const [quantity, setQuantity] = useState("");
  // const [selectedType] = useState(medicationTypes[0]); // TODO: Use when implementing form
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  // const [showFrequencySelector, setShowFrequencySelector] = useState(false);
  
  // TODO: Implement save functionality
  // const handleSave = () => {
  //   if (!name || !dosage || !frequency) {
  //     // Show validation error
  //     return;
  //   }
  //   
  //   const newMedication = {
  //     id: Date.now().toString(),
  //     name,
  //     dosage,
  //     frequency,
  //     time,
  //     instructions,
  //     color: Colors[colorScheme].primary,
  //     icon: selectedType.icon,
  //     quantity: quantity ? parseInt(quantity, 10) : undefined,
  //     remainingDoses: quantity ? parseInt(quantity, 10) : undefined,
  //     refillDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  //   };
  //   
  //   addMedication(newMedication);
  //   router.back();
  // };
  
  const handleScanPress = () => {
    router.push("/medication/scan");
  };

  const handlePhotoStitchingPress = () => {
    router.push({ pathname: "/medication/scan", params: { method: "photo_stitching" } });
  };

  const handleSinglePhotoPress = () => {
    router.push({ pathname: "/medication/scan", params: { method: "single_photo" } });
  };

  const handleSpeakLabelPress = () => {
    router.push("/medication/voice");
  };

  const handleAddManuallyPress = () => {
    router.push("/medication/manually");
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      
      {/* Medication type selector */}
      <View style={styles.formGroup}>

    

        
        {showTypeSelector && (
          <View style={styles.typeOptions}>
            {medicationTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.typeOption}
                onPress={() => {
                  // setSelectedType(type); // TODO: Implement when form functionality is added
                  setShowTypeSelector(false);
                }}
              >
                <View
                  style={[
                    styles.typeIconContainer,
                    { backgroundColor: Colors[colorScheme].icon },
                  ]}
                >
                  <Pill size={20} color={Colors[colorScheme].foreground} />
                </View>
                <Text style={styles.typeOptionText}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      {/* Scan button */}
      <TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>

        <Camera size={20} color={Colors[colorScheme].tint} />
        <Text style={styles.scanButtonText}>Scan Prescription Label</Text>
        <ChevronRight size={20} color={Colors[colorScheme].tint} />

      </TouchableOpacity>

      {/* Photo Stitching button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={handlePhotoStitchingPress}
      >
        <Layers size={20} color={Colors[colorScheme].tint} />
        <Text style={styles.scanButtonText}>Multi Capture Photos</Text>
        <ChevronRight size={20} color={Colors[colorScheme].tint} />
      </TouchableOpacity>

      {/* Single Photo button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleSinglePhotoPress}
      >
        <ImageIcon size={20} color={Colors[colorScheme].tint} />
        <Text style={styles.scanButtonText}>Single Photo</Text>
        <ChevronRight size={20} color={Colors[colorScheme].tint} />
      </TouchableOpacity>

      {/* Speak Label button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleSpeakLabelPress}
      >
        <Mic size={20} color={Colors[colorScheme].tint} />
        <Text style={styles.scanButtonText}>Speak Label</Text>
        <ChevronRight size={20} color={Colors[colorScheme].tint} />
      </TouchableOpacity>

      {/* Add Manually button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleAddManuallyPress}
      >
        <Pill size={20} color={Colors[colorScheme].tint} />
        <Text style={styles.scanButtonText}>Add Manually</Text>
        <ChevronRight size={20} color={Colors[colorScheme].tint} />
      </TouchableOpacity>

    </ScrollView>
  );
}

function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors[colorScheme].text,
      marginBottom: 24,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors[colorScheme].text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: Colors[colorScheme].input,
      borderRadius: borderRadius.md,
      padding: 16,
      fontSize: 16,
      color: Colors[colorScheme].text,
      borderWidth: 1,
      borderColor: Colors[colorScheme].secondary,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    inputText: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    inputPlaceholder: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    textArea: {
      height: 120,
      textAlignVertical: "top",
    },
    helperText: {
      fontSize: 14,
      color: Colors[colorScheme].text,
      marginTop: 4,
    },
    typeSelector: {
      backgroundColor: Colors[colorScheme].input,
      borderRadius: borderRadius.md,
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors[colorScheme].secondary,
    },
    selectedType: {
      flexDirection: "row",
      alignItems: "center",
    },
    typeIconContainer: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.xl,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    selectedTypeText: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    typeOptions: {
      backgroundColor: Colors[colorScheme].input,
      borderRadius: borderRadius.md,
      marginTop: 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme].secondary,
      overflow: "hidden",
    },
    typeOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].secondary,
    },
    typeOptionText: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    frequencyOptions: {
      backgroundColor: Colors[colorScheme].input,
      borderRadius: borderRadius.md,
      marginTop: 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme].secondary,
      overflow: "hidden",
    },
    frequencyOption: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].secondary,
    },
    frequencyOptionText: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    scanButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: `${Colors[colorScheme].tint}10`,
      borderRadius: borderRadius.md,
      padding: 16,
      marginBottom: 24,
    },
    scanButtonText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      color: Colors[colorScheme].tint,
      marginLeft: 12,
    },
    saveButton: {
      marginTop: 16,
    },
    addManuallyButton: {
      marginTop: 16,
    },
    addManuallyButtonText: {
      fontSize: 16,
      fontWeight: "500",
      color: Colors[colorScheme].tint,
    },
  });
}