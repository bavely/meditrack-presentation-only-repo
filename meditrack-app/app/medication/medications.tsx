import EmptyState from '@/components/EmptyState';
import { Colors } from '@/constants/Colors';
import { borderRadius, sizes, spacing } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { deleteMedication as deleteMedicationService, getMedications } from '@/services/medicationService';
import { useMedicationStore } from '@/store/medication-store';
import { Medication } from "@/types/medication";
import { useRouter } from 'expo-router';
import { Pill } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Switch } from 'react-native-paper';
import MedicationCard from "../../components/MedicationCard";
const MedicationsScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  const router = useRouter();
  const { medications, setMedications, deleteMedication: deleteMedicationFromStore } = useMedicationStore();
  const [query, setQuery] = useState("");
  const [medicationList, setMedicationList] = useState<Medication[]>(medications || []);
  const [showingArchived, setShowingArchived] = useState(false);

  const filteredMedications = medicationList.filter((med) =>
    med.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const fetchMedications = async () => {
      

      try {
        const meds = await getMedications();
        setMedications(meds.data);
        setMedicationList(meds.data);
      } catch (error) {
        console.error('Failed to fetch medications', JSON.stringify(error));
      }
    };
    fetchMedications();
  }, [setMedications]);

   const handleAddMedication = () => {
    router.push("/medication/add");
  };

 const handleMedicationPress = (medication: Medication) => {
  router.push({
    pathname: "/medication/[id]",
    params: { id: medication.id },
  });
};

 const handleDeleteMedication = async (id: string) => {
   try {
     await deleteMedicationService(id);
     deleteMedicationFromStore(id);
   } catch (error) {
     console.error('Failed to delete medication', JSON.stringify(error));
   }
 };

useEffect(() => {
  if (!showingArchived) {
    const activeMeds = medications.filter(med => !med.isArchived);
    setMedicationList(activeMeds);
  }else {
    const archivedMeds = medications.filter(med => med.isArchived);
    setMedicationList(archivedMeds);
  }
 }, [showingArchived, medications]);
  return (
        <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
         <TextInput
          style={styles.searchInput}
          placeholder="Search medications"
          placeholderTextColor={Colors[colorScheme].secondary}
          value={query}
          onChangeText={setQuery}
        />
       <View style={styles.statsContainer}>

          <Switch
            value={showingArchived}
            onValueChange={setShowingArchived}
            style={styles.statsDetails}
          />
                  <Text style= {styles.showArchivedText} >
            Show Archived Medications
          </Text>
        </View>
        {filteredMedications.length > 0 ? (
        filteredMedications.map((medication) => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            onPress={handleMedicationPress}
            onDelete={handleDeleteMedication}
          />
        ))
      ) : (
        <EmptyState
          icon={<Pill size={48} color={Colors[colorScheme].text} />}
          title="No Medications"
          description="You haven't added any medications yet. Tap the button below to add your first medication."
          buttonTitle="Add Medication"
          onButtonPress={handleAddMedication}
        />
      )}
        </ScrollView>
      </SafeAreaView>
  )
}

export default MedicationsScreen


function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
    },
    searchInput: {
      backgroundColor: Colors[colorScheme].input,
      color: Colors[colorScheme].text,
      padding: spacing.sm,
      borderRadius: borderRadius.sm,
      marginBottom: spacing.md,
    },
    content: {
      padding: spacing.md,
      paddingBottom: 100, // Extra padding at bottom for FAB
    },
    statsContainer: {
      flexDirection: "column",
      backgroundColor: colorScheme === 'dark' 
        ? "rgba(56, 189, 248, 0.1)" 
        : "rgba(224, 242, 254, 0.5)",
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    
    },
    statsDetails: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
    },
    statLabel: {
      fontSize: 14,
      marginTop: 4,
    },
    statDivider: {
      width: 1,
      height: "50%",
      backgroundColor: Colors[colorScheme].icon,
    },
    addButton: {
      position: "absolute",
      bottom: spacing.lg,
      right: spacing.lg,
      width: sizes.lg,
      height: sizes.lg,
      borderRadius: borderRadius.xl,
      backgroundColor: Colors[colorScheme].tint,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: Colors[colorScheme].tint,
      shadowOffset: { width: 0, height: spacing.xs },
      shadowOpacity: 0.3,
      shadowRadius: spacing.sm,
      elevation: 5,
      zIndex: 1000,
    },
    showArchivedText: {
      color: Colors[colorScheme].text,
      marginBottom: spacing.sm,
      fontSize: 16,
      fontWeight: "500",
    },
  });
}