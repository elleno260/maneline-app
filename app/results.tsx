import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  enrichIngredientsFromText,
  EnrichedIngredient,
} from "../services/ingredientService";
import {
  analyzeScanWithAI,
  AIRecommendation,
} from "../services/aiService";

type FilterType = "all" | "good" | "caution" | "unknown";
type AnalysisStep = "idle" | "parsing" | "firestore" | "gemini" | "saving" | "complete" | "error";

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value ?? "";
}

function getIngredientRating(ingredient: EnrichedIngredient) {
  if (!ingredient.found || !ingredient.data) return "unknown";
  return ingredient.data.safetyRating ?? "unknown";
}

function getRatingLabel(rating: string) {
  switch (rating) {
    case "good":
      return "Good";
    case "okay":
      return "Okay";
    case "caution":
      return "Caution";
    case "avoid":
      return "Avoid";
    default:
      return "Unknown";
  }
}

function getRatingEmoji(rating: string) {
  switch (rating) {
    case "good":
      return "✓";
    case "okay":
      return "~";
    case "caution":
      return "!";
    case "avoid":
      return "×";
    default:
      return "?";
  }
}

function getRecommendationLabel(recommendation?: string) {
  switch (recommendation) {
    case "use":
      return "Use";
    case "use_with_caution":
      return "Use With Caution";
    case "avoid":
      return "Avoid";
    case "not_enough_information":
      return "Not Enough Information";
    default:
      return "Analyzing";
  }
}
function ProgressStep({
  label,
  active,
  complete,
}: {
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <View style={styles.progressStep}>
      <View
        style={[
          styles.progressDot,
          complete && styles.progressDotComplete,
          active && styles.progressDotActive,
        ]}
      >
        <Text style={styles.progressDotText}>
          {complete ? "✓" : active ? "•" : ""}
        </Text>
      </View>

      <Text
        style={[
          styles.progressLabel,
          complete && styles.progressLabelComplete,
          active && styles.progressLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
export default function ResultsScreen() {
  const params = useLocalSearchParams();

  const extractedText = getParamValue(params.extractedText);
  const productName = getParamValue(params.productName);
  const brand = getParamValue(params.brand);
  const barcode = getParamValue(params.barcode);

  const [ingredients, setIngredients] = useState<EnrichedIngredient[]>([]);
  const [aiResult, setAiResult] = useState<AIRecommendation | null>(null);
  const [scanHistoryId, setScanHistoryId] = useState<string | null>(null);

  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>("idle");
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [expandedIngredients, setExpandedIngredients] = useState<string[]>([]);
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
  async function analyzeResults() {
    try {
      setError("");
      setAnalysisStep("parsing");
      setAnalysisMessage("Reading the ingredient list...");

      if (!extractedText || extractedText.trim().length === 0) {
        setError("No ingredient text was found. Try scanning again with better lighting.");
        setAnalysisStep("error");
        return;
      }

      setAnalysisStep("firestore");
      setAnalysisMessage("Matching ingredients with ManeLine’s database...");

      const enrichedResults = await enrichIngredientsFromText(extractedText);
      setIngredients(enrichedResults);

      setAnalysisStep("gemini");
      setAnalysisMessage("Creating your personalized recommendation...");

      const aiResponse = await analyzeScanWithAI({
        barcode: barcode || undefined,
        productName: productName || undefined,
        brand: brand || undefined,
        rawIngredientsText: extractedText,
        enrichedIngredients: enrichedResults,
        scanSource: barcode ? "barcode" : "ocr",
      });

      setAnalysisStep("saving");
      setAnalysisMessage("Saving this scan to your history...");

      setAiResult(aiResponse.aiResult);
      setScanHistoryId(aiResponse.scanHistoryId);

      setAnalysisStep("complete");
      setAnalysisMessage("Analysis complete.");
    } catch (err: any) {
      console.log("Results analysis error:", err);
      setError(
        err?.message || "Something went wrong while analyzing this product."
      );
      setAnalysisStep("error");
    }
  }

  analyzeResults();
}, [extractedText, productName, brand, barcode]);

  const ingredientStats = useMemo(() => {
    const total = ingredients.length;
    const found = ingredients.filter((item) => item.found).length;
    const unknown = total - found;
    const good = ingredients.filter(
      (item) => getIngredientRating(item) === "good"
    ).length;
    const caution = ingredients.filter((item) => {
      const rating = getIngredientRating(item);
      return rating === "caution" || rating === "avoid";
    }).length;

    return {
      total,
      found,
      unknown,
      good,
      caution,
    };
  }, [ingredients]);

  const filteredIngredients = useMemo(() => {
    if (selectedFilter === "all") return ingredients;

    if (selectedFilter === "unknown") {
      return ingredients.filter((item) => !item.found);
    }

    if (selectedFilter === "caution") {
      return ingredients.filter((item) => {
        const rating = getIngredientRating(item);
        return rating === "caution" || rating === "avoid";
      });
    }

    return ingredients.filter(
      (item) => getIngredientRating(item) === selectedFilter
    );
  }, [ingredients, selectedFilter]);

  function toggleIngredient(name: string) {
    setExpandedIngredients((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  }

const isAnalyzing =
  analysisStep === "parsing" ||
  analysisStep === "firestore" ||
  analysisStep === "gemini" ||
  analysisStep === "saving";

if (isAnalyzing) {
    return (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" />

      <Text style={styles.loadingTitle}>Analyzing your product</Text>
      <Text style={styles.loadingText}>{analysisMessage}</Text>

      <View style={styles.progressCard}>
        <ProgressStep
  label="Read ingredients"
  active={analysisStep === "parsing"}
  complete={
    analysisStep === "firestore" ||
    analysisStep === "gemini" ||
    analysisStep === "saving"
  }
/>

<ProgressStep
  label="Check database"
  active={analysisStep === "firestore"}
  complete={analysisStep === "gemini" || analysisStep === "saving"}
/>

<ProgressStep
  label="Personalize recommendation"
  active={analysisStep === "gemini"}
  complete={analysisStep === "saving"}
/>

<ProgressStep
  label="Save scan"
  active={analysisStep === "saving"}
  complete={false}
/>
      </View>
    </View>
  );
}
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageLabel}>Scan Results</Text>
          <Text style={styles.title}>
            {productName || "Product Analysis"}
          </Text>
          {brand ? <Text style={styles.subtitle}>{brand}</Text> : null}
        </View>


        <Pressable style={styles.scanAgainButton} onPress={() => router.push("/scan")}>
          <Text style={styles.scanAgainText}>Go Back to Scan</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Analysis issue</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.scoreCard}>
        <View>
          <Text style={styles.scoreLabel}>ManeLine Match</Text>
          <Text style={styles.scoreNumber}>
            {aiResult ? `${aiResult.compatibilityScore}/100` : "--"}
          </Text>
          <Text style={styles.recommendationText}>
            {getRecommendationLabel(aiResult?.recommendation)}
          </Text>
        </View>

        <View style={styles.scorePill}>
          <Text style={styles.scorePillText}>
              {aiResult ? "Personalized" : "Not available"}
            </Text>
        </View>
      </View>

      {aiResult ? (
        <View style={styles.aiCard}>
          <Text style={styles.sectionTitle}>Plain-Language Summary</Text>
          <Text style={styles.bodyText}>{aiResult.summary}</Text>

          <Text style={styles.sectionTitle}>Why ManeLine says this</Text>
          {aiResult.why.map((reason, index) => (
            <Text key={`reason-${index}`} style={styles.bulletText}>
              • {reason}
            </Text>
          ))}

          <Text style={styles.sectionTitle}>Routine Tip</Text>
          <Text style={styles.bodyText}>{aiResult.routineTip}</Text>
        </View>
      ) : (
        <View style={styles.aiCard}>
          <Text style={styles.sectionTitle}>AI Recommendation</Text>
          <Text style={styles.bodyText}>
            {"AI recommendation is not available yet."}
          </Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{ingredientStats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{ingredientStats.found}</Text>
          <Text style={styles.statLabel}>Matched</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{ingredientStats.caution}</Text>
          <Text style={styles.statLabel}>Caution</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{ingredientStats.unknown}</Text>
          <Text style={styles.statLabel}>Unknown</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Ingredient Breakdown</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        <Pressable
          style={[
            styles.filterChip,
            selectedFilter === "all" && styles.activeFilterChip,
          ]}
          onPress={() => setSelectedFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "all" && styles.activeFilterText,
            ]}
          >
            All
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            selectedFilter === "good" && styles.activeFilterChip,
          ]}
          onPress={() => setSelectedFilter("good")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "good" && styles.activeFilterText,
            ]}
          >
            Good
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            selectedFilter === "caution" && styles.activeFilterChip,
          ]}
          onPress={() => setSelectedFilter("caution")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "caution" && styles.activeFilterText,
            ]}
          >
            Caution
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            selectedFilter === "unknown" && styles.activeFilterChip,
          ]}
          onPress={() => setSelectedFilter("unknown")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "unknown" && styles.activeFilterText,
            ]}
          >
            Unknown
          </Text>
        </Pressable>
      </ScrollView>

      {filteredIngredients.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No ingredients in this filter</Text>
          <Text style={styles.emptyText}>
            Try switching back to All to see the full ingredient list.
          </Text>
        </View>
      ) : (
        filteredIngredients.map((ingredient, index) => {
          const rating = getIngredientRating(ingredient);
          const expanded = expandedIngredients.includes(
            `${ingredient.originalName}-${index}`
          );

          return (
            <Pressable
              key={`${ingredient.originalName}-${index}`}
              style={styles.ingredientCard}
              onPress={() =>
                toggleIngredient(`${ingredient.originalName}-${index}`)
              }
            >
              <View style={styles.ingredientTopRow}>
                <View style={styles.ingredientNameArea}>
                  <Text style={styles.ingredientName}>
                    {ingredient.data?.name || ingredient.originalName}
                  </Text>
                  <Text style={styles.ingredientFunction}>
                    {ingredient.data?.function ||
                      "Not found in ManeLine database yet"}
                  </Text>
                </View>

                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingEmoji}>{getRatingEmoji(rating)}</Text>
                  <Text style={styles.ratingText}>
                    {getRatingLabel(rating)}
                  </Text>
                </View>
              </View>

              {expanded ? (
                <View style={styles.expandedContent}>
                  {ingredient.found && ingredient.data ? (
                    <>
                      <Text style={styles.bodyText}>
                        {ingredient.data.description}
                      </Text>

                      {ingredient.data.benefits?.length ? (
                        <>
                          <Text style={styles.miniTitle}>Benefits</Text>
                          <Text style={styles.bodyText}>
                            {ingredient.data.benefits.join(", ")}
                          </Text>
                        </>
                      ) : null}

                      {ingredient.data.concerns?.length ? (
                        <>
                          <Text style={styles.miniTitle}>Watch out for</Text>
                          <Text style={styles.bodyText}>
                            {ingredient.data.concerns.join(", ")}
                          </Text>
                        </>
                      ) : null}

                      {ingredient.data.goodFor?.length ? (
                        <>
                          <Text style={styles.miniTitle}>Good for</Text>
                          <Text style={styles.bodyText}>
                            {ingredient.data.goodFor.join(", ")}
                          </Text>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <Text style={styles.bodyText}>
                      This ingredient has not been added to your Firebase
                      ingredient database yet. You can add it later to improve
                      ManeLine’s recommendations.
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.tapHint}>Tap to expand</Text>
              )}
            </Pressable>
          );
        })
      )}

      <Pressable
        style={styles.rawTextToggle}
        onPress={() => setShowRawText((current) => !current)}
      >
        <Text style={styles.rawTextToggleText}>
          {showRawText ? "Hide raw scan text" : "Show raw scan text"}
        </Text>
      </Pressable>

      {showRawText ? (
        <View style={styles.rawTextCard}>
          <Text style={styles.rawText}>{extractedText}</Text>
        </View>
      ) : null}

      {scanHistoryId ? (
        <Text style={styles.savedText}>Saved to scan history.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 22,
    backgroundColor: "#FFF8F1",
  },
  centeredContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#FFF8F1",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2F1B12",
    marginTop: 16,
  },
  loadingText: {
    fontSize: 15,
    color: "#6B4E3D",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    gap: 14,
  },
  pageLabel: {
    fontSize: 13,
    color: "#9A6B4F",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2F1B12",
    maxWidth: 220,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B4E3D",
    marginTop: 3,
  },
  scanAgainButton: {
    backgroundColor: "#2F1B12",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  scanAgainText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  errorCard: {
    backgroundColor: "#FFE8E0",
    borderWidth: 1,
    borderColor: "#E8B7A5",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    color: "#7A2E18",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 6,
  },
  errorText: {
    color: "#7A2E18",
    fontSize: 14,
    lineHeight: 20,
  },
  scoreCard: {
    backgroundColor: "#2F1B12",
    borderRadius: 26,
    padding: 22,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  scoreLabel: {
    color: "#EAD8C8",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  scoreNumber: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "900",
  },
  recommendationText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  scorePill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  scorePillText: {
    color: "#2F1B12",
    fontSize: 12,
    fontWeight: "900",
  },
  aiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2D2C3",
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#2F1B12",
    marginBottom: 8,
    marginTop: 8,
  },
  bodyText: {
    fontSize: 14,
    color: "#6B4E3D",
    lineHeight: 21,
  },
  bulletText: {
    fontSize: 14,
    color: "#6B4E3D",
    lineHeight: 22,
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2D2C3",
    paddingVertical: 14,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2F1B12",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B4E3D",
    fontWeight: "700",
    marginTop: 3,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2F1B12",
    marginBottom: 12,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#2F1B12",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: "transparent",
  },
  activeFilterChip: {
    backgroundColor: "#2F1B12",
  },
  filterText: {
    color: "#2F1B12",
    fontWeight: "800",
    fontSize: 13,
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  ingredientCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2D2C3",
    padding: 16,
    marginBottom: 12,
  },
  ingredientTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  ingredientNameArea: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#2F1B12",
    marginBottom: 4,
  },
  ingredientFunction: {
    fontSize: 13,
    color: "#6B4E3D",
    fontWeight: "600",
  },
  ratingBadge: {
    minWidth: 74,
    borderRadius: 14,
    backgroundColor: "#FFF8F1",
    borderWidth: 1,
    borderColor: "#E2D2C3",
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  ratingEmoji: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2F1B12",
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2F1B12",
    marginTop: 2,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#EFE2D7",
    marginTop: 14,
    paddingTop: 14,
  },
  miniTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2F1B12",
    marginTop: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tapHint: {
    fontSize: 12,
    color: "#9A6B4F",
    fontWeight: "700",
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2D2C3",
    padding: 18,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2F1B12",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B4E3D",
    lineHeight: 20,
  },
  rawTextToggle: {
    borderWidth: 1,
    borderColor: "#2F1B12",
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    marginTop: 12,
  },
  rawTextToggleText: {
    color: "#2F1B12",
    fontWeight: "900",
  },
  rawTextCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2D2C3",
    padding: 16,
    marginTop: 12,
  },
  rawText: {
    fontSize: 13,
    color: "#6B4E3D",
    lineHeight: 20,
  },
  savedText: {
    textAlign: "center",
    color: "#6B4E3D",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 20,
  },
  progressCard: {
  width: "100%",
  backgroundColor: "#FFFFFF",
  borderRadius: 22,
  borderWidth: 1,
  borderColor: "#E2D2C3",
  padding: 18,
  marginTop: 24,
},
progressStep: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 16,
},
progressDot: {
  width: 28,
  height: 28,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#E2D2C3",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 12,
  backgroundColor: "#FFF8F1",
},
progressDotActive: {
  borderColor: "#2F1B12",
  backgroundColor: "#EAD8C8",
},
progressDotComplete: {
  borderColor: "#2F1B12",
  backgroundColor: "#2F1B12",
},
progressDotText: {
  color: "#FFFFFF",
  fontWeight: "900",
  fontSize: 13,
},
progressLabel: {
  color: "#9A6B4F",
  fontSize: 15,
  fontWeight: "700",
},
progressLabelActive: {
  color: "#2F1B12",
  fontWeight: "900",
},
progressLabelComplete: {
  color: "#2F1B12",
  fontWeight: "800",
},
});